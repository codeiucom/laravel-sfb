const mix = require('laravel-mix');
const SingFileBlade = require('./SingFileBlade');

class sfb{

    register(entry, options) {
        Mix.addTask(new SingFileBlade({
            entry,
            options,
            mix: mix
        }));
    }

    webpackConfig(webpackConfig) {
        // Object.entries(webpackConfig.entry).forEach(v => {
        //     console.log(v)
        // });
    }
}

mix.extend('sfb', new sfb());
