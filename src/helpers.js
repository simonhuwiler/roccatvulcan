const consts = require('./consts.js');

function hexToRgb(hex)
{
  var result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result ? {
    r: parseInt(result[1], 16),
    g: parseInt(result[2], 16),
    b: parseInt(result[3], 16)
  } : null;

}
module.exports.hexToRgb = hexToRgb;

module.exports.buildColorBuffer = function(keylist)
{
  //Create empty Array
  // var colorbuffer = Array(consts.NUMKEYS * 3).fill({});
  var colorbuffer = []
  for(let i = 0; i < consts.NUMKEYS * 3; i++)
  {
    colorbuffer.push({})
  }

  //Fill List
  keylist.forEach((key, i) => {

    // Send colors in groups with 12 values each. First 12x the red, then 12x green, then 12x blue
    const paquet = Math.floor(i / 12)
    const offset = (i % 12) + 36 * paquet;
    colorbuffer[offset] = key.r;
    colorbuffer[offset +  12] = key.g;
    colorbuffer[offset + 24] = key.b;

  })

  return colorbuffer;  
}

module.exports.getKeys = function(color)
{
  var keys = [];
  const c = hexToRgb(color)

  for(let i = 0; i < consts.NUMKEYS; i++)
  {
    keys.push(Object.assign({}, c));
  }
  return keys;
}

module.exports.replaceAll = function(str, search, replacement) 
{
  return str.replace(new RegExp(search, 'g'), replacement);
};