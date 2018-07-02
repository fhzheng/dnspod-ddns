exports.config = {
    activemq: {
        describt:"activemq using STOMP",
        ip: "127.0.0.1",
        port: 61616,
        queue: "nodeQueue",
        user: "user",
        password: "password"
    },
email: {
        describe: "mail configs",
        host_user: "admin@hostname",
        host_pwd: "emailpassword",
        to: "receiver@email.host",
        server_host: "smtp.hostname",
        server_port: 465
    }
}