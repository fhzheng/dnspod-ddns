# dnspod-ddns

dnspod-ddns is a ddns updating tool of [DNSPod](http://www.dnspod.cn). Integrated with Email alerting.
It was originally designed for use with [node.js](http://nodejs.org).


## Download

You can install using Node Package Manager (npm):

```sh
npm install -g dnspod-ddns
```

## Usage

dnspod-ddns is a command line tool. It will update your dns record after you execute the following. You can add it to crontab for continuously updating.

```sh
dnspod-ddns --dns-domain yourdomain.com --dns-host yourhost --user youremail --passwd yourpassword
```
OR using [login_token](https://support.dnspod.cn/Kb/showarticle/tsid/227/) 

```sh
dnspod-ddns --dns-domain yourdomain.com --dns-host yourhost --login-token yourtoken
```

Otherwise, you can run it in daemon mode.

```sh
dnspod-ddns --dns-domain yourdomain.com --dns-host yourhost --user youremail --passwd yourpassword --daemon
```

OR using [login_token](https://support.dnspod.cn/Kb/showarticle/tsid/227/) 

```sh
dnspod-ddns --dns-domain yourdomain.com --dns-host yourhost --login-token yourtoken --daemon
```

In some cases, you may want to resolve the name with your local IP instead of public IP. Just use `--interface` or `-i` to specify a network interface.

```sh
dnspod-ddns --dns-domain yourdomain.com --dns-host yourhost --user youremail --passwd yourpassword --interface eth0
```

OR using [login_token](https://support.dnspod.cn/Kb/showarticle/tsid/227/) 

```sh
dnspod-ddns --dns-domain yourdomain.com --dns-host yourhost --login-token --interface eth0
```


## License

Copyright (c) 2014 Chao Shen. This software is licensed under the BSD License.
