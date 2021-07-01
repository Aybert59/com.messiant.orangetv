'use strict';

const http = require('http');
const { Device } = require('homey');

const SYNC_INTERVAL = 1000 * 20  // 20 seconds

class STBDevice extends Device {

  /**
   * onInit is called when the device is initialized.
   */
  async onInit() {
    this.log('STB has been initialized');
    this.log(this.getName());
      
    this.registerCapabilityListener("onoff", this.onCapabilityOnoff.bind(this));
    
    this.registerCapabilityListener("volume_down", this.onCapabilityVolDown.bind(this));
    this.registerCapabilityListener("volume_up", this.onCapabilityVolUp.bind(this));
    this.registerCapabilityListener("volume_mute", this.onCapabilityVolMute.bind(this));
  }

  /**
   * onAdded is called when the user adds the device, called just after pairing.
   */
  async onAdded() {
    this.log('MyDevice has been added');
    this.log(this.getName());
      
    this.sync();
    this.syncInterval = setInterval(() => this.sync(), SYNC_INTERVAL);
  }

  /**
   * onSettings is called when the user updates the device's settings.
   * @param {object} event the onSettings event data
   * @param {object} event.oldSettings The old settings object
   * @param {object} event.newSettings The new settings object
   * @param {string[]} event.changedKeys An array of keys changed since the previous version
   * @returns {Promise<string|void>} return a custom message that will be displayed
   */
  async onSettings({ oldSettings, newSettings, changedKeys }) {
    this.log('MyDevice settings where changed');
  }

  /**
   * onRenamed is called when the user updates the device's name.
   * This method can be used this to synchronise the name to the device.
   * @param {string} name The new name
   */
  async onRenamed(name) {
    this.log('MyDevice was renamed');
  }

  /**
   * onDeleted is called when the user deleted the device.
   */
  async onDeleted() {
    this.log('MyDevice has been deleted');
      clearInterval(this.syncInterval);
  }

    async sendKey (key, mode) {
        
        // reference here https://tv-orange.pourqui.com/commandes.html
        
        // mode :
        //      0 : envoi unique de touche
        //      1 : appui prolongé de touche
        //      2 : relacher la touche après un appui prolongé
        
        let ipAdr = this.getStoreValue ('ipaddress');
        let uri = 'http://' + ipAdr + ':8080/remoteControl/cmd?operation=01&key=' + key + '&mode=' + mode;
        http.get (uri);
    }
    
  // this method is called when the Device has requested a state change (turned on or off)
  async onCapabilityOnoff(value, opts) {
      this.sendKey (116, 0); // on/off
  }
    
    async onCapabilityVolDown(value, opts) {
        this.sendKey (114, 0);
        this.log('volume down');
    }
    async onCapabilityVolUp(value, opts) {
        this.sendKey (115, 0);
        this.log('volume up');
    }
    async onCapabilityVolMute(value, opts) {
        this.sendKey (113, 0);
        this.log('volume mute');
    }
    
    sync() {

        let addr = this.getStoreValue ('ipaddress');
        const testuri = 'http://' + addr + ':8080/remoteControl/cmd?operation=10';
                
        http.get(testuri, (res) => {
          const { statusCode } = res;
          const contentType = res.headers['content-type'];

          res.setEncoding('utf8');
          let rawData = '';
          res.on('data', (chunk) => { rawData += chunk; });
          res.on('end', () => {
            if (statusCode == 200) {
              try {
                let parsedData = JSON.parse(rawData);
                  this.setAvailable();
                  const status = parsedData.result.data.activeStandbyState;
                  if (status == '0') {
                      this.setCapabilityValue ('onoff', true);
      this.log ('      ... on');
                  } else {
                      this.setCapabilityValue ('onoff', false);
      this.log ('      ... off');
                  }
                  
                } catch (e) {
                    this.log(e.message);
                    this.setUnavailable();
              }
            }
          });
        }).on('error', (e) => {
            this.setUnavailable();
            this.log(`Got error: ${e.message}`);
        });
    }
    
}

module.exports = STBDevice;
