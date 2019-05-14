# Smartmeter2mqtt

## Sample data

The Keifa meter outputs the following data as you connect to the serial connection.

```text
/KFM5KAIFA-METER            // Header, Manufacturer specific

1-3:0.2.8(42)               // Version information P1 output
0-0:1.0.0(190514213620S)    // Timestamp YYMMDDhhmmssX (X=S DST/W no DST)
0-0:96.1.1(453xxxxxxxxxx)   // Electricity Meter serial number
1-0:1.8.1(002000.123*kWh)   // Total used in T1
1-0:1.8.2(001000.456*kWh)   // Total used in T2
1-0:2.8.1(001000.456*kWh)   // Total delivered back in T1
1-0:2.8.2(002000.789*kWh)   // Total delivered back in T2
0-0:96.14.0(0001)           // Current Tarrif
1-0:1.7.0(00.329*kW)        // Current use in P+ (watt resolution)
1-0:2.7.0(00.000*kW)        // Current delivery in P- (watt resolution)
0-0:96.7.21(00000)          // Number of power failures in any phase
0-0:96.7.9(00000)           // Number of long power failures in any phase
1-0:99.97.0(1)(0-0:96.7.19)(000101000001W)(2147483647*s) // Long power failures log (can be multiple)
1-0:32.32.0(00000)          // Number of voltage sags in phase L1
1-0:32.36.0(00000)          // Number of voltage swells in phase L1
0-0:96.13.1()               // Text message max 1024 characters?? Undocumented
0-0:96.13.0()               // Text message max 1024 characters??
1-0:31.7.0(002*A)           // Instantaneous current L1 in A resolution.
1-0:21.7.0(00.329*kW)       // Instantaneous power L1 (P+) in watt resolution.
1-0:22.7.0(00.000*kW)       // Instantaneous active power L1 (P-) in watt resolution.
0-2:24.1.0(003)             // Device type
0-2:96.1.0(473xxx)          // Gas meter serial number
0-2:24.2.1(190514210000S)(01543.012*m3)  // Gas usages timestamp and gas usage
!90E4                       // CRC
```