const mongoose=require('mongoose');

const tacheSchema = mongoose.Schema ({
    num_demande: {type:'Number'},
    employe: {type:'String'},
    service: {type:'String'},
    num_tache: {type:'String'},
    description_tache: { type: 'String' },
    date_creation:{type:'date'},
    date_prevue: {type:'date'},
    date_realisation: {type:'date'},
    statut: { type: 'String' },
    statutFabrication: { type: 'String' },
    statutAutomatisation: { type: 'String' },
    photo:{ type: 'String' },
    photoFabrication:{ type: 'String' },
    photoAutomatisation:{ type: 'String' },
  
    
})
module.exports = mongoose.model('Tache',tacheSchema);