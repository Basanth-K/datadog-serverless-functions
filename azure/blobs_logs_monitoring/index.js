// Unless explicitly stated otherwise all files in this repository are licensed
// under the Apache License Version 2.0.
// This product includes software developed at Datadog (https://www.datadoghq.com/).
// Copyright 2019 Datadog, Inc.

const DD_API_KEY = require('../Shared/env.js').DD_API_KEY;
const DD_TAGS = require('../Shared/env.js').DD_TAGS;

var client = require('../Shared/client.js');
var handler = require('../Shared/formatter.js');

module.exports = function (context, blobContent) {
    if (DD_API_KEY === '<DATADOG_API_KEY>' || DD_API_KEY === '' || DD_API_KEY === undefined) {
        context.log('You must configure your API key before starting this function (see ## Parameters section)');
        return;
    }

    if (DD_TAGS === '<TAG_KEY>:<TAG_VALUE>') {
        context.log.warn('You must configure your tags with a comma separated list of tags or an empty string');
    }

    var socket = client.getSocket(context);
    var handleLogs = tagger => record => {
        record = tagger(record, context);
        if (!client.send(socket, record)) {
            // Retry once
            socket = client.getSocket(context);
            client.send(socket, record);
        }
    }

    var logs = blobContent.trim().split('\n');

    logs.forEach(log => {
        handler(handleLogs, log, context);
    });

    socket.end();
    context.done();
};
