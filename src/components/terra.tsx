import * as mqtt from 'react-paho-mqtt';

import React from 'react';
import { Control } from './control';

interface TerraProps {
   
}

interface TerraState {
    temperature: string,
    humidity: string,
    planning_active: boolean | undefined,
    modes: string[],
    current_mode: string,
    controls_state: { [control: string]: boolean }
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
            current_mode: "",
            controls_state: {}
        };
        this.client = null;
    }

    connect(askCredentials : boolean = false) {

        if (this.client !== null && this.client.isConnected()) {
            this.client.disconnect();
        }

        const cookies = document.cookie.split(';');
        let username : string | null = null;
        let password : string | null = null;

        for (let i = 0; i < cookies.length; i++) {
            const cookie = cookies[i].trim();
            if (cookie.startsWith("username=")) {
            username = cookie.substring("username=".length, cookie.length);
            } else if (cookie.startsWith("password=")) {
            password = cookie.substring("password=".length, cookie.length);
            }
        }

        // Prompt for username and password if not found in cookies
        if (askCredentials || username === null || password === null) {
            username = prompt("Username");
            password = prompt("Password");
            document.cookie = "username=" + username;
            document.cookie = "password=" + password;
        }

        this.client = mqtt.connect(
            "plantescarnivores.net", 
            9001, 
            "front", 
            this.onConnectionLost, 
            this.onMessageArrived
        );

        const options = {
            userName: username,
            password: password,
            onSuccess: this.onConnect,
            onFailure: this.onConnectionLost,
            reconnect: true
        };

        this.client.connect(options);

        this.client.onConnectionLost = this.onConnectionLost;
        this.client.onMessageArrived = this.onMessageArrived;
    }

    componentDidMount() {
        this.connect();
    }

    onConnect = () => {
        console.log("Connected to MQTT server");

        // Subscribe to sensor/dht22/temperature and sensor/dht22/humidity
        this.client.subscribe("sensor/dht22/temperature");
        this.client.subscribe("sensor/dht22/humidity");
        this.client.subscribe("controls/state");
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
        } else if (message.destinationName === "controls/state") {
            const state = JSON.parse(message.payloadString);
            this.setState({
                controls_state: state
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
            <div id="terra" className="flex-container">
                
                <div className="flex-column">
                    <div className="flex-row" id="sensors-row">
                        <div id="temperature">
                            <div className="centered">
                                <div>Temperature</div>
                                <div className="value">{this.state.temperature}°C</div>
                            </div>
                        </div>
                        
                        <div id="humidity">
                            <div className="centered">
                                <div>Humidity</div>
                                <div className="value">{this.state.humidity}%</div>
                            </div>
                        </div>
                    </div>


                    <div className="flex-row" id="controls-row">
                        <div id="control-light" style={{backgroundColor: this.state.controls_state.light ? "yellow" : "white"}}>
                            <Control state={this.state.controls_state.light}>
                                <img src={require("../resources/images/light.png")} alt="Light" style={{height: "60%"}}/>
                            </Control>
                        </div>
                        
                        <div id="control-cooling">
                            <Control state={this.state.controls_state.cooling_system}>
                                <img src={require("../resources/images/cooling-system.png")} alt="Cooling system" style={{height: "60%"}}/>
                            </Control>
                        </div>
                    </div>

                    <div className="flex-row" id="planning-row">
                        <div id="planning-checkbox">
                            <label className="checkbox-button">
                                <input type="checkbox" id="planning-checkbox" defaultChecked={this.state.planning_active} onClick={this.onPlanningActiveChange}/>
                                <span className="checkmark"></span>
                                <span className="label-text">Planning</span>
                            </label>
                        </div>
                    </div>
                    
                    <div className="flex-row" id="mode-row">
                        <div id="mode">
                            <div className="dropdown">
                                <label>Mode</label>
                                <select value={this.state.current_mode} onChange={this.onModeChange} disabled={this.state.planning_active || this.state.planning_active === undefined || this.state.modes.length === 0}>
                                    {this.state.modes.map((mode) => <option value={mode} key={mode}>{mode}</option>)}
                                </select>
                            </div>
                        </div>
                    </div>

                    <div className="flex-row" id="change-login-row">
                        <div className="change-login">
                            <input type="button" value="Change login" onClick={() => {
                                this.connect(true);
                            }
                            }/>
                        </div>
                    </div>
                </div>
            </div>

        );
    }

}