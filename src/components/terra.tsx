import * as mqtt from 'react-paho-mqtt';

import React from 'react';

interface TerraProps {
    username: string,
    password: string
}

interface TerraState {
    temperature: string,
    humidity: string,
    planning_active: boolean | undefined,
    modes: string[],
    current_mode: string
}

export class Terra extends React.Component<TerraProps, TerraState> {
    
    client: any;

    constructor(props : TerraProps) {
        super(props);
        this.state = {
            temperature: "-",
            humidity: "-",
            planning_active: undefined,
            modes: [],
            current_mode: ""
        };
    }

    componentDidMount() {
        this.client = mqtt.connect(
            "plantescarnivores.net", 
            9001, 
            "front", 
            this.onConnectionLost, 
            this.onMessageArrived
        );

        const options = {
            userName: this.props.username,
            password: this.props.password,
            onSuccess: this.onConnect,
            onFailure: this.onConnectionLost,
            reconnect: true
        };

        this.client.connect(options);

        this.client.onConnectionLost = this.onConnectionLost;
        this.client.onMessageArrived = this.onMessageArrived;

    }

    onConnect = () => {
        console.log("Connected to MQTT server");

        // Subscribe to sensor/dht22/temperature and sensor/dht22/humidity
        this.client.subscribe("sensor/dht22/temperature");
        this.client.subscribe("sensor/dht22/humidity");
        this.client.subscribe("conf");

        // Get current conf
        this.client.publish("get_conf", "1");
    }

    componentWillUnmount() {
        this.client.disconnect();
    }

    onConnectionLost = (responseObject : any) => {
        if (responseObject.errorCode !== 0) {
            console.log("onConnectionLost:" + responseObject.errorMessage);
        }
    }

    onMessageArrived = (message : any) => {
        console.log("onMessageArrived:" + message.payloadString);
        if (message.destinationName === "sensor/dht22/temperature") {
            this.setState({
                temperature: message.payloadString
            });
        } else if (message.destinationName === "sensor/dht22/humidity") {
            this.setState({
                humidity: message.payloadString
            });
        } else if (message.destinationName === "conf") {
            const conf = JSON.parse(message.payloadString);
            this.setState({
                planning_active: conf.planning.active,
                modes: conf.modes,
                current_mode: conf.current_mode
            });
        }


    }
    
    onPlanningActiveChange = (event : any) => {
        this.setState({
            planning_active: event.target.checked
        });
        this.client.publish("planning/active", event.target.checked ? "1" : "0");
        this.client.publish("get_conf", "1");
    }

    onModeChange = (event : any) => {
        this.setState({
            current_mode: event.target.value
        });
        this.client.publish("mode/set", event.target.value);
    }

    render() {
        return (
            <div>
                <h1>Temperature: {this.state.temperature}</h1>
                <h1>Humidity: {this.state.humidity}</h1>

                <div className="planning_checkbox">
                    <input type="checkbox" defaultChecked={this.state.planning_active} onClick={this.onPlanningActiveChange} />
                    <label>Follow planning</label>
                </div>

                <div className="mode_select">
                    <label>Mode</label>
                    <select value={this.state.current_mode} onChange={this.onModeChange} disabled={this.state.planning_active || this.state.planning_active === undefined || this.state.modes.length === 0}>
                        {this.state.modes.map((mode) => <option value={mode} key={mode}>{mode}</option>)}
                    </select>
                </div>
                
            </div>

        );
    }

}