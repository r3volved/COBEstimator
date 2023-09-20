const mil = (n) => n * 1000000

//tti = time to identify (days)
//ttc = time to contain (days)

/** Potential attack vectors */
export const vectors = {
    destruction:{
        label:'Destructive attack',
        impact:mil(5.12),
        tti:233,
        ttc:91 
    },
    ransom:{
        label:'Ransomware',
        impact:mil(4.54),
        tti:237,
        ttc:89 
    },
    email:{
        label:'Business email compromise',
        impact:mil(4.89),
        tti:234,
        ttc:84 
    },
    phishing:{
        label:'Phishing',
        impact:mil(4.91),
        tti:219,
        ttc:76 
    },
    vulnerability:{
        label:'Vulnerability in third-party software',
        impact:mil(4.55),
        tti:214,
        ttc:70 
    },
    credentials:{
        label:'Stolen or compromised credentials',
        impact:mil(4.50),
        tti:243,
        ttc:84 
    },
    inside:{
        label:'Malicious insider',
        impact:mil(4.18),
        tti:216,
        ttc:68 
    },
    social:{
        label:'Social engineering',
        impact:mil(4.10),
        tti:201,
        ttc:69 
    },
    physical:{
        label:'Physical security compromise',
        impact:mil(3.96),
        tti:217,
        ttc:63 
    },
    cloud:{
        label:'Cloud misconfiguration',
        impact:mil(4.14),
        tti:183,
        ttc:61 
    },
    accident:{
        label:'Accidental data loss or lost device',
        impact:mil(3.94),
        tti:189,
        ttc:69 
    },
    error:{
        label:'System error',
        impact:mil(3.82),
        tti:149,
        ttc:67 
    }
}
