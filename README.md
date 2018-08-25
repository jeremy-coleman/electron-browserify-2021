# React Browserify Demo
> A demonstration of React with Gulp, Browserify, PostCSS, and Hot Module Replacement

#styles
```text
the gulp task 'gulp start' will launch the demonstration app - its not so pretty but that's not the point

check out src/client/styles
  -vendor.css - imports the @blueprintjs core css from a css file
  -vendor2.css also imports @blueprintjs core css and all of bootstrap css
  -the less folder imports a bunch of local stuff 
  -- note) the style files are concat'd first so you don't need to import variables(and shouldn't, it will cause an error)
   -- this has benefits and drawbacks, but just take note of it. if you want to change the behavior, see the primary gulpfile.ts and
   remove the concat call before compiling. you will also have to add import statements or do some other wizardry
   
  after compiling , inspect dist/client/styles.min.css to see how much of the imported css made it into the build
  -- the extreme minification comes from postcss / purgecss

```

#hmr
```text
if you see in src/desktop/main.ts the browser loads the file using the file protocol and references the html file on disk

this is important for developing in a more realstic environment for the electron production build

you will also notice there is no react-hot-loader present in the client code
the react HMR is provided by reactlivereload, which handles this for you.

there is an additional livereload socket running for styles, because livereactload uses watchify - it's good for inlining styles but not external injection


```

#other style notes
```text
you can require('./mycssfile.css) and it will be INLINED (and hot reloadable ) via browserify-postcss (see tools/browserify/postcss.ts for the config)

any other css file you add will be automatically added to the head , no importing required besides adding the file into the src folder somewhere
NOTE: that because of this, the ORDER matters for how the stream is merged - files injected into the head last have the highest priority and will overwrite files that are inject earlier


```

#monorepo notes
```text
-the packages/ folder is aliased to @coglite - and unlike other monorepo setups provides HMR capability on ALL packages instantly

- to see this working, run 'gulp start' and click somewhere on the minesweeper screen to start the timer.
then navigate to packages/minesweeper/minesweeper.tsx , scroll to the bottom of the file and change the name="moves" to name="movezzz" or whatever you like
you will see the HMR working without resetting the timer state.
```
```js
        </div>
        <div className="footer">
          <GameStat value={this.state.grid.totalFlags()} name="Bombs" />
          <GameStat value={this.state.moves} name="Moves" />
          <GameStat value={this.formatTime()} name="Time" />
        </div>
      </div>
 ```

### Installation
Clone the repo and run `npm install`

### Usage
1. Run `npm run start` to start the development server with HMR
2. Run `npm run start:prod` to create a production build
