### Prerequisites
- `yarn`
- `node`
- `git`

### Before starting
- open covidCron.js
- change `zipcode`, `phoneNumber`, `radiusInMiles`, `filepath`, `timezone` to desired values
- time zones can be found at this [link](https://gist.github.com/diogocapela/12c6617fc87607d11fd62d2a4f42b02a)

### To start
- Run `yarn` to install dependicies
- Run `yarn start` to start cron task
- to stop hit `CTRL+C`


### Description

Script will run a cron job from 8am-6pm every minute hitting projectexodus's api endpoint for checking for covid vaccine appointments within a specified range (in miles) from a specified zip code and record results to `results.json`. When new results are found a native desktop notification will pop up with a sound (you may be asked to allow terminal to have access to notifications). You can check the running logs to confirm that results are coming back from the endpoint in the terminal.

