module.exports =
{
    mediasoup :
        {
            workerSettings :
                {
                        logLevel : 'warn',
                        logTags  :
                            [
                                'info',
                                'ice',
                                'dtls',
                                'rtp',
                                'srtp',
                                'rtcp',
                                'rtx',
                                'bwe',
                                'score',
                                'simulcast',
                                'svc',
                                'sctp'
                            ],
                        rtcMinPort : process.env.MEDIASOUP_MIN_PORT || 40000,
                        rtcMaxPort : process.env.MEDIASOUP_MAX_PORT || 49999
                    },
            mediaCodecs :
                [
                        {
                                kind      : 'audio',
                                mimeType  : 'audio/opus',
                                clockRate : 48000,
                                channels  : 2
                        },
                        {
                                kind       : 'video',
                                mimeType   : 'video/VP8',
                                clockRate  : 90000,
                                parameters :
                                    {
                                            'x-google-start-bitrate' : 1000
                                    }
                        },
                        {
                                kind       : 'video',
                                mimeType   : 'video/VP9',
                                clockRate  : 90000,
                                parameters :
                                    {
                                            'profile-id'             : 2,
                                            'x-google-start-bitrate' : 1000
                                    }
                        },
                        {
                                kind       : 'video',
                                mimeType   : 'video/h264',
                                clockRate  : 90000,
                                parameters :
                                    {
                                            'packetization-mode'      : 1,
                                            'profile-level-id'        : '4d0032',
                                            'level-asymmetry-allowed' : 1,
                                            'x-google-start-bitrate'  : 1000
                                    }
                        },
                        {
                                kind       : 'video',
                                mimeType   : 'video/h264',
                                clockRate  : 90000,
                                parameters :
                                    {
                                            'packetization-mode'      : 1,
                                            'profile-level-id'        : '42e01f',
                                            'level-asymmetry-allowed' : 1,
                                            'x-google-start-bitrate'  : 1000
                                    }
                        }
                ],
            webRtcTransportOptions :
                {
                    listenIps :
                        [
                            {
                                ip          : process.env.MEDIASOUP_LISTEN_IP || '192.168.0.101',
                                announcedIp : process.env.MEDIASOUP_ANNOUNCED_IP
                            }
                        ],
                    initialAvailableOutgoingBitrate : 1000000,
                    minimumAvailableOutgoingBitrate : 600000,
                    maxSctpMessageSize              : 262144,
                    // Additional options that are not part of WebRtcTransportOptions.
                    maxIncomingBitrate              : 1500000
                },
        }
}