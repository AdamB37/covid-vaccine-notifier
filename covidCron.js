const cron = require('node-cron');
const axios = require('axios').default;
const moment = require('moment');
var { promises: { readFile, writeFile } } = require('fs');
const notifier = require('node-notifier');

const zipcode = '94610';
const phoneNumber = '+15107602791';
const radiusInMiles = 50;
const filepath = '/Users/adambeshir/Documents/tmp/results.json'


const formatDate = (date) => moment(date? date : undefined).tz('America/Los_Angeles').format('MMMM Do YYYY, h:mm:ss a');

const addResultToFile = async (results) => {
    console.log('adding results to file')
    try {
        const resultsArr = await getResults();
        const newResults = await getNewResults(results);
        newResults.forEach(result => {
            const index = resultsArr.map( ({id}) => id ).indexOf(result.id)
            if (index > 0) {
                resultsArr[index] = result
            } else {
                resultsArr.push(result)
            }
        })
        await writeToFile(resultsArr);
    } catch (error) {
        console.error(error)
    }
}

const writeToFile = async (resultsArr) => {
    const sortedArr = resultsArr.sort((a,b) => moment(a.appointmentsUpdated).isSameOrAfter(moment(b.appointmentsUpdated)) ? -1 : 1);
    formattedArr = sortedArr.map(d => ({...d, appointmentsUpdatedFormatted: formatDate(d.appointmentsUpdated)}));
    try {
        await writeFile(filepath, JSON.stringify(formattedArr, null, 2));
        console.log('write result to file: success!');
        
    } catch (error) {
        console.error(error);
    }
}

const removeStaleResults = async (noAppointmentResults) => {
    const resultsArr = await getResults();
    const noAppointmentResultsIds = noAppointmentResults.map( ({id}) => id);
    const filteredResults = resultsArr.filter(({id}) => !noAppointmentResults.includes(id));
    if(filteredResults.length < resultsArr.length) {
        await writeToFile(filteredResults);
    }
}

const getResults = async () => {
    try {
        const json = await readFile(filepath);
        const resultsArr = JSON.parse(json) || [];
        return resultsArr
    } catch {
        return [];
    }
}

const getNewResults = async (results) => {
    const existingResults = await getResults();
    return results
        .filter((result) => (
            !existingResults.some(r => {
                r.id === result.id && r.appointmentsUpdated === result.appointmentsUpdated
            })
        ));
}

const checkForAppointments = async (date = formatDate()) => {
    const url = `https://api.prod.projectexodus.us/get-locations/v2/${zipcode}?radius=${radiusInMiles}`;
    try {
        const res = await axios.get(url);
        const json = res.data;
        const results = json.results || [];

        console.log('unfiltered results:', results.length);

        const noAppointmentResults = results.filter(result => !result.appointments);
        const filteredResults = json.results
            .filter(({ appointments, appointmentsUpdated, medNames }) => (
                    appointments && 
                    moment().diff(moment(appointmentsUpdated), 'minutes') <= 2 &&
                    Object.values(medNames).some(val => val)
                )
            );

        await removeStaleResults(noAppointmentResults);

        const newResults = await getNewResults(filteredResults);

        if(newResults.length) {
            await notifyNewResults(newResults);
            await addResultToFile(newResults);
        } else {
            console.log('no results found')
        }

    } catch (error) {
        console.error(error);
    }
}


const startCronJob = () => {
    cron.schedule(
        '* 8-17 * * *',
        async () => {
            const date = moment().tz('America/Los_Angeles').format('MMMM Do YYYY, h:mm:ss a');
            console.log(`running cron job (${date})`);
            checkForAppointments(date);
        },
        { 
            timezone: 'America/Los_Angeles'
        }
    );
}

checkForAppointments();
startCronJob();

