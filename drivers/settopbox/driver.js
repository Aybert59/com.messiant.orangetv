'use strict';

const http = require('http');
const { Driver } = require('homey');
const ip = require('ip');


class STBDriver extends Driver {

  /**
   * onInit is called when the driver is initialized.
   */
  async onInit() {
    this.log('Driver SetTopBox has been initialized');
  }


    async getInfo(addr, session, devices) {

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
            
                  devices.push({
                             name: parsedData.result.data.friendlyName,
                             data: {
                                 id: parsedData.result.data.macAddress,
                             },
                             store: {
                                 ipaddress: addr,
                              }
                         });
this.log(devices);
                  session.emit("list_devices", devices);
                  
              } catch (e) {
                this.log(e.message);
              }
            }
          });
        }).on('error', (e) => {
          //this.log(`Got error: ${e.message}`);
        });
        
        return devices;
}

    onMapDeviceClass( device ) {
            return STBDevice;
      }
    
    async onPair(session) {
      this.log('STB pairing started');
            
      const devices = [];
 
        session.setHandler("list_devices", async function () {
            // emit when devices are still being searched
            session.emit("list_devices", devices);

            // return devices when searching is done
            return devices;

          });
        

        let myIP = ip.address();
        let lastDot = myIP.lastIndexOf(".");
        let ipAddrPrefix = myIP.substring(0, lastDot + 1);
        
        
        // for each ip detecter s'il y a un device, et l'ajouter
        for (let i = 2; i < 255; i++) {

          let testIP = ipAddrPrefix + i;
          this.getInfo(testIP, session, devices);

        }
  
        return ;

      }

}

module.exports = STBDriver;
