# grunt-bootloader

> Setup your webproject in an instant

## Getting Started
This plugin requires Grunt `~0.4.5`

If you haven't used [Grunt](http://gruntjs.com/) before, be sure to check out the [Getting Started](http://gruntjs.com/getting-started) guide, as it explains how to create a [Gruntfile](http://gruntjs.com/sample-gruntfile) as well as install and use Grunt plugins. Once you're familiar with that process, you may install this plugin with this command:

```shell
npm install grunt-bootloader --save-dev
```

Once the plugin has been installed, it may be enabled inside your Gruntfile with this line of JavaScript:

```js
grunt.loadNpmTasks('grunt-bootloader');
```

OR if you are starting a fresh project you can skip basic setup, and simply run this command

```bash
$ bootloader create --name=myapp --port=8080

```
This will setup most of the basic configuration for bootloader project.


## The "bootloader" task

### Overview
In your project's Gruntfile, add a section named `bootloader` to the data object passed into `grunt.initConfig()`.

```js
grunt.initConfig({
  bootloader: {
      options : {
        indexBundles : ["webmodules/bootloader","myproject/app"],
        src : "./",
        dest : "dest",
        resourcesJson : "resource.json"
      }
  },
});
```

### Options

#### options.indexBundles
Type: `Array`
Default value: `["webmodules/bootloader"]`

A list of bundles to be combined  according to preference order of their being loaded on ui.

#### options.src
Type: `String`
Default value: `'./'`

Path to root of project.

#### options.dest
Type: `String`
Default value: `'dist'`

path to where build files to be generated.

#### options.resourceJson
Type: `String`
Default value: `'dist/resource.json'`

path to resource file which will have all the static resources listed.

#### options.resourcesInline
Type: `Boolean`
Default value: `false`

if set to `true` resourceJson will be part of initial bundled file.

#### options.sort
Type: `Boolean`
Default value: `false`

if set to `true` modules will be sorted in alphabetically order.

#### options.order
Type: `Boolean`
Default value: `false`

if set to `true` single order-line will be followed.

#### options.modulize
Type: `Boolean`
Default value: `false`

if set to `true` one file per module.json is created.

#### options.bootServer.port
Type: `Number`
Default value: `8090`

port where dev server will be running

### Usage Examples

#### Command Lines
In this example, the default options are used to do something with whatever. So if the `testing` file has the content `Testing` and the `123` file had the content `1 2 3`, the generated result would be `Testing, 1 2 3.`

To make build for local development, Note: First time on  machine this command wont work, so run `bootloader:bundlify` only first time.
```js
  grunt.registerTask('scan', ['bootloader:scan:skip', 'sass:dist', 'cssmin']); 
```

To make production build. Note :-  it must be run first time on machine before scan.

```js
  grunt.registerTask('build', ['bootloader:bundlify', 'sass:dist', 'cssmin']);
```

#### Some handy bootloader commands
```bash
$ bootloader scan //scan files => grunt cssmin bootloader:scan
$ bootloader build // creates build files ready to use on production server =>  gitinfo cssmin bootloader:bundlify
$ bootloader watch // starts watch server => grunt watch
$ bootloader check --jsb --css // check and optinally fixes js files and css files => grunt jshint jsbeautifier cssmin
```
##### bootloader shortcut 
```bash
  $ bl scan 
  $ bl build
```

## Contributing
In lieu of a formal styleguide, take care to maintain the existing coding style. Add unit tests for any new or changed functionality. Lint and test your code using [Grunt](http://gruntjs.com/).

## Release History
_(Nothing yet)_
