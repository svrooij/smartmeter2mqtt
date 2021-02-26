---
layout: default
title: Decryption
parent: Advanced
---

# Read encrypted DSMR messages

Smartmeters in Luxemborg are encrypting DSMR messages on the P1 port. You can request the key from your energy supplier, the key will look like `056F9B0CFEDF150E889BEAD52FA7A174` (hexadecimal 16 bytes).

## Decrypt messages

If you want to enable decrypting you only have to set the key, as argument `--enc-key` or as environment variable `SMARTMETER_ENC-KEY` and once you restart it will automatically decrypt and validate the messages.

If you enable the [raw tcp socket](/outputs/socket.html#raw-socket) you can just this application just for decrypting the messages and forwarding them to some other application.

### Encryption specs

For those interested the encryption works as follows. They use `aes-128-gcm` encryption, as found in the [specification](https://smarty.creos.net/wp-content/uploads/P1PortSpecification.pdf) (page 9). And the decryption is done by the [p1-crypt](https://github.com/svrooij/smartmeter2mqtt/blob/beta/src/p1-crypt.ts) file.

Needed data:

| What | Docs | Value |
|:-------|:-----|:----|
| **AAD** | Additional data (17 bytes) for validation |  `3000112233445566778899AABBCCDDEEFF` hex, default |
| **IV** | 96 bits total `system-title (64 bits)`  + `frame counter (32 bits)` | |
| **KEY** | (request from energy company) 16 bytes / 128 bits | `056F9B0CFEDF150E889BEAD52FA7A174` hex, fictive key |

Each encrypted message has a sequential number that is specified in the message (the frame counter), this value is then written in the message so you can use it to parse the data.

Each message (converted to hexadecimal representation) looks like this:

```text
db08abcdefabcdef1234000236300000000a632a0d6906545bb83d844c4f917647c2d03130211b9119b98f49e9b7cda67499445997301e0a0b570951f9f8ebef12dfddc71b1f405f502a86fe85fbafb8fab7b6d0f59b1626527c21d63f60ae1bbd91c20bab4d8c48f5c7eb3443032a02b591874eb75a96ad00e7b2fa815938fbf3842ca8964f1a22acf7312e90020e730591c6a1b85d709ecbd6eacef828c44f07b5f34e219cd09d6047d23c74181303cf8d04ab3790aab2d264a60d971bce3382eb6e3bc4ac0e0b1ebf630244433d5507c9d2674256878e5d0506f1a6c7029bc89d43eefdfd2a765b87e80808a5004e1714750f47b6f2b507ea295503bb6394f1a8fa46c5309fef84258bf1b20f450097ed1aab393c5a68cbe60aa51e1606cb711ddd9e3afb1b23177efa0b4bcc00f6e105ba759c69c3abc598ddaa806fb8e78a5d68bd74ba51520ee8c6054eeb2a0c25a17992b5b043740a8d7d521b316f156ef7202b6b520eb81fb96617079673cef3e955a5791fcc356d38a08514d9ec8cccd46be9de106c882f66bbb53e8291cf99f74122b6caccde878f79cc7bb9b5219d9e2131879bea23d3a616ad82f3fb1be6c9a112039a0a991e2f66d7a8c54e4a2f5d015a79df3fe24623df0b934d234a2a6dbbe0797e00ca69cdd2dd4c36cc7077e64dd88c3a58a46bbea4a6be97b0420569315e783505a573e7071112af1ba30e2c79d06a8773e395a27c3452b7d16f674221be6273a9afe7475fccc282e950098e09552c0762ead82e085d5459f6b737c5dec34f49c49313c500c1751a5055f02d9d
```

And contains the following data:

| What | Value (sample) | bytes | specs |
|:--   |:--             |:--    |:--    |
| Start | `db` | `1` | hex, static |
| Length of system title | `08` |  `1` |  hex, static |
| System title (needed for IV) | `abcdefabcdef1234` |  `8` | 8 bytes / 64 bits (or other if length changes) |
| Number of bytes that follow | `000236` |  ?  (use delimeter) | 17 + length of data |
| Delimiter | `30` |  `1` | hex, static |
| Unknown value | `82` |  `1` | hex |
| Frame counter (needed for IV) | `00000a` |  `3` | 3 bytes / 24 bits | 
| Data :tada: | `...` |   `(see length above)` | computed number of bytes |
| GCM tag | `9313c500c1751a5055f02d9d` (max) |  `12` | 12 bytes / 96 bits |

