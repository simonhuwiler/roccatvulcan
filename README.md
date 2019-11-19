# Roccat Vulcan API
With this Node Module you can control your Roccat Vulcan Keyboard. Bring your keyboard to life!  

## Demo / Video
This module was developed for an interactive data visualisation. Have a look:  
<a href="http://www.youtube.com/watch?feature=player_embedded&v=D0B6WE92s6I
" target="_blank"><img src="http://img.youtube.com/vi/D0B6WE92s6I/0.jpg" 
alt="IMAGE ALT TEXT HERE" width="240" height="180" border="10" /></a>

## Installation
Install per npm  
`npm install roccatvulcan`  
or clone repository  
`git clone git@github.com:simonhuwiler/roccatvulcan.git`

## Usage
**Important**: Close your Roccat Swarm App (right click -> close)
```javascript
//Load module
const RoccatVulcan = require('roccatvulcan');

//Init Keyboard
keyboard = new RoccatVulcan({
  productId: 12440,
  layout: 'ch-de',
  ready: () => {
    console.log("Keyboard is ready!");

    //Set every key to yellow
    keyboard.fillAll('#ffcc00');

    //Send new colors to keyboard
    keyboard.render();
  }
});
```

## Init Parameters
`productId`  
To connect with your keyboard, this library needs the ID of your product. Default `12440` works fine for the Roccat Vulcan 120. If you have another Vulcan, you need to change this. If the keyboard is not found, you will see all possible devices in your terminal. Copy the Id of the corresponding one.

`layout`  
The keyboard layout. At the moment only `ch-de` supported. Duplicate the folder `keyboardlayout/ch-de` and make your own!

`ready`  
Callback after keyboard is initialised.

`onData`  
Callback when key pressed

## Render-Methods
When ever you change the colors of a key, the api will store every key in the memory. The api will not send the new colors to the keyboard by itself, you need to **render** the current state. Two methods will help you:
### Single rendering
`keyboard.render()`  
This will send all the current colors to the keyboard
### Auto rendering
`keyboard.renderStart(50);`  
This will start continous rendering every 50 millisecond.  
  
`keyboard.renderStop();`  
This stops the auto renderer.

## Coloring-Methods
### `fillAll(color)`
Will colorize each key. **Be aware**: Only hex-colors are supported. No `blue` or `black`  
`keyboard.fillAll('#ffcc00');`

### `updateKeys(keys, color[, backgroundColor])`
Will only update the given keys, all other keys will remain the same. Except: `backgroundColor` is given!  
Params:
* `keys`: List of Keys
* `color`: New color in hex
* `backgroundColor`: optional. Changes the color of all other keys  

**Example**  
`keyboard.updateKeys(['W', 'A', 'S' ,'D'], '#ff0000')`

### `updateKey(key, colors[, backgroundColor])`
Same as `updateKeys` but takes only one key.  
`keyboard.updateKeys('W', '#ff0000')`

### `animateKeys(keys, colorFrom, colorTo, duration)`
Creates a transition between two colors. Be aware: Auto Rendering needs to be running!  
Params:
* `keys`: List of Keys to animate
* `colorFrom`: Start color
* `colorTo`: End Color
* `duration`: Duration in Miliseconds

**Example**  
`keyboard.animateKeys(['W', 'A', 'S', 'D'], '#000000', '#ff0000', 1000);`

### `animateKey(key, colorFrom, colorTo, duration)`
Same as above with single key  
`keyboard.animateKeys('W', '#000000', '#ff0000', 1000);`

### `write(text, color, keyOffset)` //Experimental!
Writes given Text on the keyboard. **Only a few keys are currently supported! Have a look at** `keyboardlayout/ch-de/alphabet.js`  
Example:  
`keyboard.write("ANNA", '#ff0000', 20)`

### `marquee(text, color, speed)` //Experimental!
Writes text the same way as `write` but let the text scroll over the keyboard. Like the old HTML-Tag `marquee`. **Only a few keys are currently supported! Have a look at** `keyboardlayout/ch-de/alphabet.js`  
`keyboard.marquee("ANNA", '#ff0000', 200);`

## AnimationQueue
You can queue animations and run them at will. Use the AnimationQueue for that purpose.  

### Add Animation to Queue
`keyboard.animationQueueAdd(animation, timeout);`  
Params:
* `animation`: Function which will be triggered.
* `timeout`: After how many milliseconds **after the last animation** this animation should be triggered

### Start Animation Queue
`keyboard.animationQueueStart(onFinish)`  
Starts the Animation Queue and will trigger `onFinish` after all animations have finished

### Stop and Clear Animation Queue
`keyboard.animationQueueStop()`  

### Example
This will change the colors of the Keys AWSD.
```javascript
keyboard.animationQueueAdd(() => this.keyboard.animateKeys(['W', 'A', 'S', 'D'], '#000000', '#ffcc00', 2000), 0);
keyboard.animationQueueAdd(() => this.keyboard.animateKeys(['W', 'A', 'S', 'D'], '#ffcc00', '#3224ee', 2000), 2000);
keyboard.animationQueueAdd(() => this.keyboard.animateKeys(['W', 'A', 'S', 'D'], '#3224ee', '#d324ee', 2000), 2000);
keyboard.animationQueueAdd(() => this.keyboard.animateKeys(['W', 'A', 'S', 'D'], '#d324ee', '#55bc18', 2000), 2000);
keyboard.animationQueueStart();
```

## Get Key Pressed event
To get the key press event, you can bind an event to the `onData` option on initialisation:
```javascript
//Init Keyboard
keyboard = new RoccatVulcan({
  productId: 12440,
  layout: 'ch-de',
  onData: data => {
    console.log("Key", data.key);
    console.log("State", data.state);
  }
});
```
The data parameter is an object with two states:
* `key`: The key pressed
* `state`: The state: 1 = pressed, 0 = released


## Turn of a Key
To turn of a key, you need to send the color (#000000) black to the keyboard.  
`keyboard.fillAll('#000000');`

## Project made with this library
* DataViz about eSports: https://github.com/simonhuwiler/dataviz_keyboard

Write me to be listed here!