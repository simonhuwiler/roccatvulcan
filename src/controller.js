
const colors = require('./helpers.js');

module.exports.sendColorsToKeyboard = function(ledDevice, keys)
{
  //Transform color objects to stream
  const colorBuffer = colors.buildColorBuffer(keys);

  //Add signals to array
  var buffer = [0xa1, 0x01, 0x01, 0xb4].concat(colorBuffer);

  //Send 64bits per run
  for(let i = 0; i < Math.ceil(buffer.length) / 64; i++)
  {
    const iFrom = i * 64;
    const iTo = iFrom + 64;

    const r = ledDevice.write([0x00].concat(buffer.slice(iFrom, iTo)));
    if(r < 65)
    {
      raise("Could not send data")
    }
  }

}

