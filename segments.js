const mil = (n) => n * 1000000

/** Cost segmets */
const segments = {
    notification:{
        label:'Notification',
        impact:mil(0.31) 
    },
    response:{
        label:'Post Breach Response',
        impact:mil(1.18) 
    },
    escalation:{
        label:'Detection and Escalation',
        impact:mil(1.44) 
    },
    business:{
        label:'Lost Business',
        impact:mil(1.42) 
    }
}

module.exports = segments