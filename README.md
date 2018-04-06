# Bank Holidays on an IPCortex Communication System
A simple script to add bank holidays to nightmodes, on an IPCortex Communication System (CS). From 6.3 nightmodes can have a calendar to force them to be on/off at certain dates, ignoring the normal weekly schedule. The most requested reason for this feature was due to bank holidays, which made the perfect example for the new API!

It will add bank holidays to all nightmodes on all companies on the system.

# Installing
You will need:
* An IPCortex CS running 6.3.0 or higher
* Node.js 6.4.0 or higher

Clone the repo as follows:
```shell
git clone https://github.com/ipcortex/bank-holidays.git
cd bank-holidays
npm i
```
Then copy `config.example.js` to `config.js` and edit to taste.

After that you'll be ready to go by running `./app.js` in the directory you did the clone!

# Contributing/feedback
We're always listening for feedback! Please feel free to raise issues on here, or tweet me [@jamiek23](https://twitter.com/jamiek23) or [@ipcortex](https://twitter.com/ipcortex).

If you fancy making changes or improvements, submit a pull request for us to review. Please make sure your changes pass ESLint by running `npm test`. :)

# Acknowledgements
* We use the [GOV.UK bank holiday](https://www.gov.uk/bank-holidays) data in [JSON form](https://www.gov.uk/bank-holidays) - shout out to GDS for making that data freely available and in an easily consumable form!

# Licence
MIT licenced. See the [LICENCE](LICENCE) file for details.
