var HID = require('node-hid');
const initialization = require('./initialization.js');
const helpers = require('./helpers.js');
const controller = require('./controller.js');
const consts = require('./consts.js')

module.exports = class RoccatVulkan
{
  constructor(options)
  {
    options = options ? options : {};

    //Import Keyboard layout
    const layout = 'layout' in options ? options.layout : 'ch-de';
    this.grid = require(`./keyboardlayout/${layout}/grid.js`);
    this.keylist = require(`./keyboardlayout/${layout}/keys.js`);
    this.keybuffer = require(`./keyboardlayout/${layout}/keybuffer.js`);
    this.alphabet = require(`./keyboardlayout/${layout}/alphabet.js`)
    
    console.log("Initialize Vulcan")
    
    this.animateTimers = [];
    this.animationQueue = [];
    this.currentColors = helpers.getKeys('#000000');

    //All USB Devices
    const allDevices = HID.devices();

    //Filter Roccat
    const productIds = options.productId ? [options.productId] : consts.PRODUCTIDS;
    const roccatDevices = allDevices.filter(d => productIds.includes(d.productId))

    if(options.onData)
    {
      //Register Read Event. Search for Interface 1 and usagePage 10. Why? Know Idea. If this not reacts to your keyboard, try to register to other device
      const keyDevice = roccatDevices.filter(d => d.interface === 1 && d.usagePage === 10)
      if(keyDevice.length > 0)
      {
        try
        {
          const readDevice = new HID.HID(keyDevice[0].path);
          let key = 0;
          readDevice.on("data", d => {
            switch(d[2])
            {
              case 10: key = this.keybuffer.KEYREADBUFFER10[d[3]]; break;
              case 204: key = this.keybuffer.KEYREADBUFFER204[d[3]]; break;
              case 251: key = this.keybuffer.KEYREADBUFFER251[d[3]]; break;
            }
            options.onData({key: key, state: d[4]})
          })
        }
        catch(e)
        {
          console.log("Could not register onData-Event. Keyboard does not react. Change usePage in Code. Sorry")
          console.log(e)
        }
      }
    }

    //Find LED Interface Number (No 1)
    const ledDeviceInfo = roccatDevices.find(e => e['interface'] ===  consts.LEDINTERFACE)

    if(!ledDeviceInfo) 
    {
      const msg = 'Could not find Keyboard (LED Device). You need to update the productId. This products are connected to your computer:'
      console.log(msg)
      //roccatDevices.forEach(d => console.log(`${d.productId}: ${d.}))
      const dev = allDevices.filter(d => d.manufacturer && d.manufacturer.toLowerCase() === 'roccat');
      console.log(dev)
      throw(msg)
    }

    //Open LED Device
    this.ledDevice = new HID.HID(ledDeviceInfo.path);

    //Find Control Device
    const ctrlDeviceInfos = roccatDevices.filter(e => e['interface'] ===  consts.CTRLINTERFACE);

    //Brutforce: Open one by one and look at result.
    var ctrlDevice = null;
    for(var i in ctrlDeviceInfos)
    {
      try
      {
        ctrlDevice = new HID.HID(ctrlDeviceInfos[i].path);
        var buf = ctrlDevice.getFeatureReport(0x0f, 255);
        if(buf.length > 0)
        {
          break;
        }
      }
      catch(e)
      {
        //console.error("Could not open device", e)
        // console.log("Could not open device", e)
      }
    }

    if(!ctrlDevice)
    {
      raise("Control Device not found!")
    }

    // //Start Keyboard initialisation
    initialization.run(ctrlDevice)
    .then(() => {

      //Initialisation done. Close Ctrl Device
      ctrlDevice.close()
      console.log("Roccat Server Ready")

      //Callback
      if(options.ready)
        options.ready();

    })
  }

  get currentColor()
  {
    return this.currentColors;
  }

  set currentColor(val)
  {
    this.currentColors = val;
  }

  getGrid()
  {
    return this.grid.KEYGRID;
  }
  
  fillAll(color)
  {
    this.currentColors = helpers.getKeys(color);
  }

  //Colors the keys. Use background for other keys. Leave empty to use them as they are
  updateKeys(keys, color, backgroundColor)
  {
    //Fill background or leave as it is
    if(backgroundColor)
      this.currentColors = helpers.getKeys(backgroundColor);

    for(let i in keys)
    {
      const key = keys[i];

      //When key is string, find corresponding id. If integer, it is already the id
      var id = key;
      if(typeof(key) === 'string')
      {

        if(!(key in this.keylist.KEYMAPPER))
        {
          console.log("Key " + key + " not found in Keylist");
          return;
        }
    
        id = this.keylist.KEYMAPPER[key];
      }
  
      if(typeof color === "string")
      {
        color = helpers.hexToRgb(color);
      }
      else if(typeof color === "object")
      {
        color = color;
      }
      else
      {
        console.log("Wrong color. Bust me hex-string (#ffcc00) or objekct ({r: 255, g: 255, b:255}")
        console.log(color)
      }
      
      this.currentColors[id] = color;
    }
  }

  render()
  {
    controller.sendColorsToKeyboard(this.ledDevice, this.currentColors);
  }

  updateKey(key, color, background)
  {
    this.updateKeys([key], color, background);
  }

  animateKeys(keys, colorFrom, colorTo, duration)
  {
    const start = Date.now();
    var rgbFrom = helpers.hexToRgb(colorFrom);
    var rgbTo = helpers.hexToRgb(colorTo);
    var rgbRunning = Object.assign({}, rgbFrom);

    const rMax = rgbTo.r - rgbFrom.r;
    const gMax = rgbTo.g - rgbFrom.g;
    const bMax = rgbTo.b - rgbFrom.b;

    const timer = setInterval(() => {

      var runningTime = Date.now() - start;
      runningTime = runningTime > duration ? duration : runningTime;

      //Calculate new RGB-Value
      const percentage = 100 / duration * runningTime;
      rgbRunning.r = Math.round(rgbFrom.r + rMax / 100 * percentage);
      rgbRunning.g = Math.round(rgbFrom.g + gMax / 100 * percentage);
      rgbRunning.b = Math.round(rgbFrom.b + bMax / 100 * percentage);

      //Send new Value
      this.updateKeys(keys, rgbRunning)

      //Clear Timer if duration ends
      if(runningTime >= duration)
      {
        const t = this.animateTimers.find(e => e === timer)
        if(t)
          clearInterval(t)
      }
        
    }, consts.ANIMATIONINTERVAL);
    this.animateTimers.push(timer);
  }

  close()
  {
    if(this.ledDevice)
    {
      this.ledDevice.close();
    }
  }

  write(text, color, keyOffset)
  {
    //Convert Color
    const rgbColor = helpers.hexToRgb(color);

    //Create empty binary grid
    var binaryGrid = this.grid.KEYGRID.map(row => row.map(cell => 0));

    var gridPos = keyOffset;
    for(let i = 0; i < text.length; i++)
    {
      const char = this.alphabet[text.charAt(i)];
      for(let row = 0; row < char.length; row++)
      {
        for(let column = 0; column < char[row].length; column++)
        {
          binaryGrid[row][column + gridPos] = char[row][column];
        }
      }
      
      //Update gridPos
      gridPos += char[0].length + keyOffset;
    }

    //Create Screen and map binarygrid to it
    var screen = helpers.getKeys('#000000');
    for(let row = 0; row < binaryGrid.length; row++)
      {
        for(let column = 0; column < binaryGrid[row].length; column++)
        {
          if(column > this.grid.KEYGRID[row].length)
            break
  
          //Search corresponding key
          if(binaryGrid[row][column] === 1 && this.grid.KEYGRID[row][column] != consts.NOKEY)
          {
            screen[this.grid.KEYGRID[row][column]] = rgbColor;
          }
        }
      }

    this.currentColors = screen;
    controller.sendColorsToKeyboard(this.ledDevice, this.currentColors);
  }

  marquee(text, color, speed)
  {
    //Convert Color
    const rgbColor = helpers.hexToRgb(color);

    //Create empty binary grid
    var binaryGrid = this.grid.KEYGRID.map(row => row.map(cell => 0));

    //Create textgrid
    var textGrid = [[], [], [], [], [], []];

    const emptyLine = new Array(6).fill(new Array(consts.SPACEBETWEEN).fill(0));
    // const emptyLine = [[0, 0, 0], [0, 0, 0], [0, 0, 0], [0, 0, 0], [0, 0, 0], [0, 0, 0]]
    
    for(let i = 0; i < text.length; i++)
    {
      const char = this.alphabet[text.charAt(i)];
      textGrid = textGrid.map((row, j) => row.concat(emptyLine[j]).concat(char[j]))
    }

    //Concat Binary and Textgrid
    binaryGrid = binaryGrid.map((row, i) => row.concat(textGrid[i]));

    //TEST
    // binaryGrid = textGrid;


    const timer = setInterval(() => {

      //Remove first row of grid
      for(let row in binaryGrid)
        binaryGrid[row].shift();

      //Get black screen
      var screen = helpers.getKeys('#000000');

      for(let row = 0; row < binaryGrid.length; row++)
      {
        for(let column = 0; column < binaryGrid[row].length; column++)
        {
          if(column > this.grid.KEYGRID[row].length)
            break
  
          //Search corresponding key
          if(binaryGrid[row][column] === 1 && this.grid.KEYGRID[row][column] != consts.NOKEY)
          {
            screen[this.grid.KEYGRID[row][column]] = rgbColor;
          }
        }
      }
  
      this.currentColors = screen;
      
      controller.sendColorsToKeyboard(this.ledDevice, this.currentColors);

      //Clear Timer if no grid columns left
      if(binaryGrid[0].length === 0)
      {
        const t = this.animateTimers.find(e => e === timer)
        console.log("finished")
        if(t)
          clearInterval(t)
      }
        
    }, speed);
    this.animateTimers.push(timer);

  }

  animationQueueAdd(animation, delay)
  {
    this.animationQueue.push({animation: animation, delay: delay});
  }

  animationQueueStart(onFinish)
  {
    if(this.animationQueue.length === 0)
    {
      onFinish();
      return;
    }

    var animationQueueCurrent = 0;

    const nextAnimation = ()  =>
    {
      setTimeout(() => {

        //Perhaps animationqueue has already stopt
        if(this.animationQueue.length === 0)
          return;

        //Start Animation
        this.animationQueue[animationQueueCurrent].animation()

        animationQueueCurrent++;

        //Has animation? Trigger. Otherwise: Trigger callback
        if(animationQueueCurrent < this.animationQueue.length)
          nextAnimation();
        else if(onFinish)
          onFinish()
          

      }, this.animationQueue[animationQueueCurrent].delay)
    }

    //Start Animation
    nextAnimation();
  }

  animationQueueStop()
  {
    this.animationQueue = [];
    this.animationQueueCurrent = 0;
  }

  renderStart(interval)
  {
    this.renderStop();

    interval = interval ? interval : consts.ANIMATIONINTERVAL;
    this.autoRender = setInterval(() => this.render(), interval);
  }

  renderStop()
  {
    if(this.autoRender)
      clearInterval(this.autoRender);
  }

}