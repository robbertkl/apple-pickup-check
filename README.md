# apple-pickup-check

Notifier for pickup availability of Apple products in Dutch Apple Stores. Used after the 2017 iPhone X launch.

## Usage

Docker-compose:

```yaml
pickupcheck:
  image: robbertkl/apple-pickup-check
  restart: always
  environment:
    TELEGRAM_BOT_TOKEN: xxx
    TELEGRAM_CHAT_ID: xxx
    TWITTER_CONSUMER_KEY: xxx
    TWITTER_CONSUMER_SECRET: xxx
    TWITTER_ACCESS_TOKEN: xxx
    TWITTER_ACCESS_TOKEN_SECRET: xxx
```

You can leave out the `TELEGRAM_` and/or `TWITTER_` environment variables to disable them.

## License

Published under the [MIT License](http://www.opensource.org/licenses/mit-license.php).
