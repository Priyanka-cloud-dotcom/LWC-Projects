import { LightningElement, track, wire } from 'lwc';
import getTimeZones from '@salesforce/apex/WorldClockController.getTimeZones';
import getTimeFromAPI from '@salesforce/apex/WorldClockController.getTimeFromAPI';

export default class WorldClock extends LightningElement {
    @track timeZoneOptions = [{ label: 'India (Kolkata)', value: 'Asia/Kolkata' },
        { label: 'United States (New York)', value: 'America/New_York' },
        { label: 'United Kingdom (London)', value: 'Europe/London' },
        { label: 'Australia (Sydney)', value: 'Australia/Sydney' },
        { label: 'Japan (Tokyo)', value: 'Asia/Tokyo' },
        { label: 'China (Shanghai)', value: 'Asia/Shanghai' },
        { label: 'Germany (Berlin)', value: 'Europe/Berlin' },
        { label: 'Canada (Toronto)', value: 'America/Toronto' },
        { label: 'Brazil (Sao Paulo)', value: 'America/Sao_Paulo' },
        { label: 'South Africa (Johannesburg)', value: 'Africa/Johannesburg' },
        // Add more time zones as needed
    ];
    @track selectedTimeZone = '';
    @track time = '';
    @track error;
    @track svgHourHandStyle = '';
    @track svgMinuteHandStyle = '';
    @track svgSecondHandStyle = '';
    intervalId;

    // Handle time zone selection
    handleTimeZoneChange(event) {
        this.selectedTimeZone = event.detail.value;
        this.fetchTime(); // Fetch time immediately
        this.startClock(); // Start the clock
    }

    // Fetch time based on selected time zone
    fetchTime() {
        if (this.selectedTimeZone) {
            getTimeFromAPI({ location: this.selectedTimeZone })
                .then(result => {
                    this.time = result;
                    this.error = undefined;
                    this.updateClockHands(result);
                })
                .catch(error => {
                    this.error = error.body.message;
                    this.time = undefined;
                });
        } else {
            this.error = 'Please select a time zone.';
        }
    }

    // Start the clock
    startClock() {
        if (this.intervalId) {
            clearInterval(this.intervalId); // Clear existing interval
        }
        this.intervalId = setInterval(() => {

            const currentTime = new Date(this.time);
            currentTime.setSeconds(currentTime.getSeconds() + 1); // Increment time by 1 second
            this.time = currentTime;
            this.updateClockHands(this.time);

        }, 1000); // Update every second
    }

    // Update clock hands based on the fetched time
    updateClockHands(timeValue) {
        let currentTime;

        // Ensure `timeValue` is a Date object
        if (typeof timeValue === 'string') {
            currentTime = new Date(timeValue);
        } else {
            currentTime = timeValue;
        }

        if (isNaN(currentTime.getTime())) {
            console.error('Invalid time value:', timeValue);
            return;
        }

        const hours24 = currentTime.getHours();
        const minutesNum = currentTime.getMinutes();
        const secondsNum = currentTime.getSeconds();

        console.log('Parsed Time - Hours:', hours24, 'Minutes:', minutesNum, 'Seconds:', secondsNum);

        // Calculate hand angles
        const hourAngle = ((hours24 % 12) * 30) + (minutesNum * 0.5);
        const minuteAngle = (minutesNum * 6) + (secondsNum * 0.1);
        const secondAngle = secondsNum * 6;

        console.log('Updated Angles - Hour:', hourAngle, 'Minute:', minuteAngle, 'Second:', secondAngle);

        // Update styles for SVG clock hands
        this.svgHourHandStyle = `transform: rotate(${hourAngle}deg); transform-origin: 100px 100px;`;
        this.svgMinuteHandStyle = `transform: rotate(${minuteAngle}deg); transform-origin: 100px 100px;`;
        this.svgSecondHandStyle = `transform: rotate(${secondAngle}deg); transform-origin: 100px 100px;`;
    }


}