# Laravel Single File Blade

script/style section convert to js/css file.

## install

use composer

```shell
composer require codeiucom/laravel-sfb
```

## Use normal (without laravel-mix)

1. sample-layout.blade.php

   ```html
   <!doctype html>
   <html lang="en">
       <head>
           <meta charset="UTF-8">
           <title>Document</title>
           @stack('head-style')
       </head>
       <body>
           @yield('content')

           @stack('body-js')
       </body>
   </html>
   ```

3. sample.blade.php

   ```html
   @include('sample-layout')

   @section('content')
   <div>
       text
   </div>
   @endsection

   @sfbScript('body-js')
   <script>
       console.log("test");
   </script>
   @endSfb

   @sfbStyle('head-style')
   <style>
       .div {
           color: gray;
       }
   </style>
   @endSfb
   ```

5. reload browser

## Use with laravel-mix

install npm package

```shell
npm install vendor/codeiucom/laravel-sfb/node_module
```

### Use

1. edit laravel.mix.js  

   - normal

      ```javascript
      require("codeiucom-laravel-sfb");
      mix.sfb(`resources/views/**/*.blade.php`);
      ```  

   - or with scss options

      ```javascript
      require("codeiucom-laravel-sfb");
      mix.sfb(`resources/views/**/*.blade.php`, {
          sass: {
              pluginOptions: [],
              postCssPlugins: [require("tailwindcss")],
          },
      });
      ```

3. sample.blade.php

   ```html
   @include('sample-layout')

   @section('content')
   <div>
       text
   </div>
   @endsection

   @sfbMixScript('body-js')
   <script>
       console.log("test");
   </script>
   @endSfb

   <!-- with sass: type="text-scss" -->
   @sfbMixStyle('head-style')
   <style type="text/scss">
       .div {
           color: gray;
       }
   </style>
   @endSfb
   ```

5. run laravel mix
   ```shell
   npm run dev
   # or
   npm run prod
   ```

## Option

### change compiled path

Default path: /public/assets/sfb  
edit .env file

```dotenv
# /public/vdendor/sfb is
CODEIU_LARAVEL_SFB_FILE_DIR=vendor/sfb
```

### change laravel mix compiled path

edit .env file

```dotenv
CODEIU_LARAVEL_SFB_MIX_FILE_DIR=sfb
```