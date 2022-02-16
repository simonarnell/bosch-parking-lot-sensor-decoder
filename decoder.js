/* 
 * Decoder function for The Things Network to unpack the payload of Bosch Parking Lot Sensors
 *
 * More info on the sensors/buy online:
 * https://connectedthings.store/lorawan-sensors/bosch-parking-lot-sensors.html
 *
 * This function was created by Al Bennett at Sensational Systems - al@sensational.systems
 */

function Decoder(bytes, port) {

  var decoded = {
    "bytes": bytes,
    "port": port,
    "packet_type": "Unknown"
  };

    // Parking status packets are on port 1
  // Heartbeat packets are on port 2, but the same as status packets, so handled the same
  if(1 === port || 2 === port) {
    
    if(1 === port) {
      decoded.packet_type = "Status";
    } else {
      decoded.packet_type = "Heartbeat";
    }

    decoded.occupied = (1 === bytes[0]) ? true : false;
    decoded.temperature = bytes[1] & 0x80 ? bytes[1] - 0x100 : bytes[1]
  }

  // Startup packets are on port 3
  if(3 === port) {
    
    decoded.packet_type = "Startup";
    
    // Bytes 0 - 11 are debug info
    decoded.debug = bytes.slice(0, 12);
    
    // Bytes 12 - 14 are firmware version, convert to string
    decoded.firmware_version = bytes[12] + '.' + bytes[13] + '.' + bytes[14];
    
    // Byte 15 is the reset reason, convert to string
    decoded.reset_reason = 0;
    
    switch (bytes[15]) {
      case 1: decoded.reset_reason = "Watchdog";
        break;
      case 2: decoded.reset_reason = "Power On";
        break;
      case 3: decoded.reset_reason = "System Request";
        break;
      case 4: decoded.reset_reason = "External Pin";
        break;
      case 5: decoded.reset_reason = "Lockup";
        break;
      case 6: decoded.reset_reason = "Brownout";
        break;
      case 7: decoded.reset_reason = "Others";
        break;
      default: decoded.reset_reason = "Unknown";
    } 
    
    // Final byte, 16, is seven reserved bits with the LSB being the current occupancy state
    decoded.occupied = false;
    if(1 === (bytes[16] & 1)) {
      decoded.occupied = true;
    }
  }

  if(4 === port) {

    decoded.packet_type = "Device Information";

    switch (bytes.length) {
      // if there are three bytes to the packet then it's the firmware version
      case 3: 
        decoded.packet_type += " - Firmware version"
        decoded.firmware_version = bytes[0] + '.' + bytes[1] + '.' + bytes[2];
        break;
      // if there are eleven bytes to the packet then it's the devices uniform resource name
      case 11:
        decoded.packet_type += " - Device URN"
        // Bytes 0 - 2 are the first six digits of the DevEUI whilst bytes 6 - 10 are the remaining 10 digits, convert to string
        decoded.devEUI = bytes[0].toString(16) + bytes[1].toString(16) + bytes[2].toString(16) + bytes[6].toString(16) + bytes[7].toString(16) + bytes[8].toString(16) + bytes[9].toString(16) + bytes[10].toString(16)
        decoded.productClass = {
          // Bits 7 - 4 of byte 3 when added to byte 4 form the least significant bits of the product code, convert to string
          productCode: ((bytes[4] << 4) + (bytes[3] >> 4)) == 0x001 ? "PLS" : "Unknown",
          // Bits 0 - 3 of byte 3 form the variant code, convert to string
          variantCode: bytes[3] & 0xf,
          // Byte 5 is the product class extension code which seemes to encode the LoRa frequency band, convert to string
          extension: bytes[5] == 0x00 ? "EU868" : bytes[5] == 0x01 ? "AS923" : "Unknown",
        }
        break;
      default:
        break;
    }
  }
  return decoded;

}
