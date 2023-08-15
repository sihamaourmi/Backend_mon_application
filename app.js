
var express = require('express');
var app = express();


//le path c'est pour le html on aura pas besoin ici
var path = require('path'); 

//dotenv
require('dotenv').config();

//Method Override
const methodoverride = require('method-override')
app.use(methodoverride('_method'))

//Brypt : encodage
const bcrypt = require('bcrypt')

//Connexion à la base de données
const url = process.env.DATABASE_URL

//Mongoose
var mongoose = require('mongoose'); 

//bodyparser
var bodyParser = require('body-parser');
app.use(bodyParser.urlencoded({ extended: false }));

//le module

const Demande = require('./models/Demande');
const Tache = require('./models/Tache');



//Connexion à la base de données
mongoose.connect(url, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
}).then(console.log("MongoDB connected !"))
    .catch(err => console.log(err))

    app.set('view engine', 'ejs');


    //cookier parcser:pour la securete
const cookieParser = require ('cookie-parser');
app.use(cookieParser())
const {createToken,validateToken} = require ('./JWT');






//Authentification
//cors:permet de recuperer des donnees qui vient des sites exterieures;il autorise l'acces et le pouvoir de recuperer le TOken et de permettre a se connecter
const cors = require('cors');
var corsOptions={
    credentials:true,//l'acces au session et au cookies
    origin:'http://localhost:3000',//donner l'acces au 3000
    //statut d'erreur
    //200:tout iras bien//socket-io
    //404:
    //500:ERREUR SERVEUR
    optionsSuccessStatus:200
}
app.options('*',cors(corsOptions));
app.use(cors(corsOptions));






//Multer: pour les images 
const multer = require('multer');
const Utilisateur = require('./models/Utilisateur');
app.use(express.static('uploads'));//express.static :pour lire le dossier 'uploads' parce que expresse le connait pas.
const storage = multer.diskStorage(
  {
    destination: (req, file, cb) => {
      cb(null, 'uploads/');
    },
    filename: (req, file, cb) => {
      cb(null, file.originalname);//le nom de fichier 
    }
  }
);
const upload = multer({ storage });
app.post('/upload', upload.single('file'), (req, res) => {
  if (!req.file) {
    res.status(400).send('No file uploaded');
  } else {
    res.send('file uploaded successfully')
  }
})



//............... Utilisateur................
//----------------------Routes-------------------------------

//----------------------Page d'inscription-------------------------------
    app.get('/new-utilisateur', function (req, res) {
        res.render('Inscription');
    });

//------------Enregistrement des coordonnées utilisateur dans la base de donnes-------------------------------
    app.post('/submit-login', upload.single('file'), function (req, res) {
        const Data = new Utilisateur({  
            nom: req.body.nom, 
            prenom: req.body.prenom,
            email: req.body.email,
            service: req.body.service,
            password:  bcrypt.hashSync(req.body.password, 10),
            imagename:req.body.imagename
        })
        Data.save().then((data) => {
            // console.log("Data saved successfully !");
            // res.redirect('/allutilisateur') 
            res.json(data)
        }).catch(err => { console.log(err) });
    });
//----------------------page utilisateur-------------------------------

    app.get('/allutilisateur',validateToken, function (req, res) {
        Utilisateur.find().then((data) => {
            console.log(data);
            // res.render('AllUtilisateur', { data: data });
            res.json(data);
        }).catch(err => console.log(err))
    });

//----------------Recuperation d'un seul utilisateur avec id -------------------------------
    app.get('/utilisateur/:id', function (req, res) {
        console.log(req.params.id);
        Utilisateur.findOne({ 
            _id: req.params.id
        }).then(data => {
            // res.render('EditUtilisateur', { data: data });
            res.json(data);
        }).catch(err => console.log(err))
    });
    
 
    //----------------------Modification utilisateur-------------------------------
    app.put('/utilisateur/edit/:id', upload.single('file'), function (req, res) {
        console.log(req.params.id);
        const Data = ({
            nom: req.body.nom, 
            prenom: req.body. prenom,
            email: req.body.email,
            service: req.body.service,
            password: req.body.password,
            imagename:req.body.imagename
        })
        Utilisateur.updateOne({ _id: req.params.id }, { $set: Data })
            .then(data => {
                console.log("Data updated")
                // res.redirect('/allutilisateur')
                res.json("data updated")
            }).catch(err => console.log(err));
    });
    
   //----------------------Suppression Utilisateur-------------------------------
    app.delete('/utilisateur/delete/:id', function (req, res) {
        Utilisateur.findOneAndDelete({ _id: req.params.id })
            .then(() => {
                res.redirect('http://localhost:3000/allutilisateur');
            }).catch(err => { console.log(err) });
    });




//----------------------Page de connexion-------------------------------
    app.get('/login', function (req, res) {
        res.render('Login')
    });
    
    app.post('/api/login', function (req, res) {
        Utilisateur.findOne({
            nom: req.body.nom
        }).then((utilisateur) => {
            if (!utilisateur){
                // si le Password et correcte et le  Username pas correcte on affiche
                res.send('NO User found')
            }
            console.log(Utilisateur);
            if (!bcrypt.compareSync(req.body.password,utilisateur.password)) {
                 // si le Username et correcte et le mot pass pas correcte on affiche
                 res.send("Invalid password!"); 
            }
            const accessToken = createToken(utilisateur);  
            res.cookie("access-token",accessToken,{
              maxAge : 60*60*24*30 ,
              httpOnly : true
          });
            console.log("user found");
            // res.render('Allutilisateur', { data: Utilisateur })
            res.redirect('http://localhost:3000/alldemande') 
    
        }).catch(err => console.log(err));
    });
    

    //Deconnecter
app.get('/deconnecter', (req, res) => {
  // Supprimer le JWT du cookie
  res.clearCookie('access-token');

  // Envoyer une réponse indiquant que l'utilisateur est déconnecté
//  res.json({ message: 'Utilisateur déconnecté' });
res.redirect('http://localhost:3000/new-demande') 
});
    
    //...............Page Demande................
    //----------------------Routes-------------------------------


    //----------------------Nouvelle Demande-------------------------------
    app.get('/new-demande',validateToken, function (req, res) {
        res.render('NewDemande');
    });

//-----------------Enregistrement d la demande sur la base de donne-------------------------------
    app.post('/submit-demande', upload.single('file'), function (req, res) {
        const Data = new Demande({  
          num_demande: req.body.num_demande, 
          client: req.body.client,
          service: req.body.service,
          num_ligne: req.body.num_ligne,
          nom_machine: req.body.nom_machine,
          zone: req.body.zone,
          degre_urgence: req.body.degre_urgence,
          description:req.body.description,
          date_creation:req.body.date_creation,
          date_prevue:req.body.date_prevue,
          date_realisation:req.body.date_realisation,
          statut:req.body.statut,
          date_validation:req.body.date_validation,
          image:req.body.image,
          imageAssemblage:req.body.imageAssemblage||"",

        
          


          //pour la date de creation par l'utilisateur
        date_creation : Date.now()

        })
        Data.save().then((data) => {
            console.log("Data saved successfully !");
            
          //  res.redirect('/alldemande') 
          res.json(data);
        }).catch(err => { console.log(err) });
    });



//validateToken:Pour authentification 
    app.get('/alldemande',validateToken, function (req, res) {
        Demande.find().then((data)=> {
          var base64Url = req.cookies['access-token'].split('.')[1];
            var personConnected=JSON.parse(atob(base64Url));
            console.log(data);
            //res.render('AllDemande', { data: data });     
            
    
      
            Tache.find()
            .then((tache)=> {
              data.forEach(element => {
                element.indiceFabri=tache.filter(e=>(e.statut=="Terminer" &&
                element.num_demande==e.num_demande)).length;

                var allTask=tache.filter(e=>(element.num_demande==e.num_demande));
                var allTaskTerminer=allTask.
                filter(e=>((e.statut=="Terminer" && e.statutFabrication=="Terminer")
                ||  e.statutAutomatisation=="Terminer" ));
                var nbTachCF=allTask.
                filter(e=>((e.statut=="Terminer" && e.statutFabrication=="Terminer"))).length;
                var nbTachAuto=allTask.filter(e=>((e.statutAutomatisation=="Terminer"))).length;

                element.indiceAssemblage=allTask.length===allTaskTerminer.length 
                && allTaskTerminer.length!=0 && nbTachCF!=0 && nbTachAuto!=0;

              });

              console.log("-----------------------------");
              console.log(data);
                
        res.json({data:data,
          nom:personConnected.data.nom ,
          prenom:personConnected.data.prenom,
          service:personConnected.data.service,
          admin:personConnected.data.admin
       });


                });
            
      

        }).catch(err => console.log(err))
    });

//-----------------Recuperation de la demande avec id -------------------------------
    app.get('/demande/:id', validateToken,function (req, res) {
      var base64Url = req.cookies['access-token'].split('.')[1];
      var personConnected=JSON.parse(atob(base64Url));
        console.log(req.params.id);
        Demande.findOne({ 
            _id: req.params.id
        }).then(data => {
          //  res.render('EditDemande', { data: data });
          //res.json(data);
          res.json({data:data,
            nom:personConnected.data.nom ,
            prenom:personConnected.data.prenom,
            service:personConnected.data.service,
            admin:personConnected.data.admin
         });
        }).catch(err => console.log(err))
    });
    

    
 
    //----------------------Modification de la demande-------------------------------
    app.put('/demande/edit/:id', upload.single('file'), function (req, res) {
        console.log("req.body");
        const Data = ({
          num_demande: req.body.num_demande, 
          client: req.body.client,
          service: req.body.service,
          num_ligne: req.body.num_ligne,
          nom_machine: req.body.nom_machine,
          zone: req.body.zone,
          degre_urgence: req.body.degre_urgence,
          description:req.body.description,
          date_prevue:req.body.date_prevue,
          date_realisation:req.body.date_realisation,
          statut:req.body.statut,
          date_validation:req.body.date_validation,
          image:req.body.image,
          imageAssemblage:req.body.imageAssemblage,
        })
        console.log("============>"+Data);
        Demande.updateOne({ _id: req.params.id }, { $set: Data })
            .then(data => {
                console.log("Data updated")
                //res.redirect('/alldemande')
                res.json("data updated")
            }).catch(err => console.log(err));
    });
    
   //----------------------Suppression de la demande -------------------------------
    app.delete('/demande/delete/:id', function (req, res) {
        Demande.findOneAndDelete({ _id: req.params.id })
            .then(() => {
              res.redirect('http://localhost:3000/alldemande');
            }).catch(err => { console.log(err) });
    });












    //............... Page Tache................
    //----------------------Routes-------------------------------







    //----------------------Nouvelle Tache-------------------------------
    app.get('/new-tache/',validateToken, function (req, res) {
      res.render('NewTache');
  });

//-----------------Enregistrement d la tache sur la base de donne-------------------------------
  app.post('/submit-tache', upload.single('file'), function (req, res) {
      const Data = new Tache({  
        num_demande: req.body.num_demande, 
        employe: req.body.employe,
        service: req.body.service,
        num_tache: req.body.num_tache,
        description_tache: req.body.description_tache,
        date_creation:req.body.date_creation,
        date_prevue:req.body.date_prevue,
        date_realisation:req.body.date_realisation,
        statut:req.body.service==="Automatisation"? "":req.body.statut,
        statutFabrication:req.body.statutFabrication,
        statutAutomatisation:req.body.service==="Automatisation"? req.body.statut:req.body.statutAutomatisation,
        photo:req.body.service==="Automatisation"? "":req.body.photo,
        photoFabrication:req.body.photoFabrication,
        photoAutomatisation:req.body.service==="Automatisation"? req.body.photo:req.body.photoAutomatisation,


        //pour la date de creation par l'utilisateur
      date_creation : Date.now()

      })
      Data.save().then((data) => {
          console.log("Data saved successfully !");
        //  res.redirect('/alltache') 
        res.json(data);
      }).catch(err => { console.log(err) });
  });


  app.get('/alltaches',validateToken, function (req, res) {

    var base64Url = req.cookies['access-token'].split('.')[1];
    var personConnected=JSON.parse(atob(base64Url));

    Tache.find().then((data)=> {

      console.log(data);
      res.json({data:data,
        nom:personConnected.data.nom ,
        prenom:personConnected.data.prenom,
        service:personConnected.data.service,
        admin:personConnected.data.admin
     });
    }).catch(err => console.log(err))

  });


//validateToken:Pour authentification 
app.get('/alltache/:num_demand',validateToken, function (req, res) {

  var base64Url = req.cookies['access-token'].split('.')[1];
  var personConnected=JSON.parse(atob(base64Url));

  console.log("========jkjkjk=====>"+req.params.num_demand);
  if(personConnected.data.service=="admin"){
    Tache.find().then((data)=> {
      data=data.filter(e=> req.params.num_demand==e.num_demande);

      console.log(data);
      //res.render('AllDemande', { data: data });          
  
  res.json({data:data,
        nom:personConnected.data.nom ,
        prenom:personConnected.data.prenom,
        service:personConnected.data.service,
        admin:personConnected.data.admin
     });
  
      
        console.log(data);
        //res.render('AllTache', { data: data });
        //res.json(data);
    }).catch(err => console.log(err))

  }
  else if(personConnected.data.service=="Fabrication"){

    Tache.find()
    .then((data)=> {
      data=data.filter(e=>(e.service=="Conception" && e.statut=="Terminer" && req.params.num_demand==e.num_demande) ||
      (e.service==personConnected.data.service && req.params.num_demand==e.num_demande));
      console.log(data);
      //res.render('AllDemande', { data: data });          
  
  res.json({data:data,
        nom:personConnected.data.nom ,
        prenom:personConnected.data.prenom,
        service:personConnected.data.service,
        admin:personConnected.data.admin
     });
  
      
        console.log(data);
        //res.render('AllTache', { data: data });
        //res.json(data);
    }).catch(err => console.log(err))

  }

  else if(personConnected.data.service=="Conception"){

    Tache.find()
    .then((data)=> {
      data=data.filter(e=>((e.service=="Conception" || e.service=="Fabrication" ) && req.params.num_demand==e.num_demande) );
      console.log(data);
      //res.render('AllDemande', { data: data });          
  
  res.json({data:data,
        nom:personConnected.data.nom ,
        prenom:personConnected.data.prenom,
        service:personConnected.data.service,
        admin:personConnected.data.admin
     });
  
      
        console.log(data);
        //res.render('AllTache', { data: data });
        //res.json(data);
    }).catch(err => console.log(err))

  }
  else{

    Tache.find()

    .then((data)=> {
      console.log(data);
      data=data.filter(e=>e.service==personConnected.data.service
         && req.params.num_demand==e.num_demande);
      console.log(data);
      //res.render('AllDemande', { data: data });          
  
  res.json({data:data,
        nom:personConnected.data.nom ,
        prenom:personConnected.data.prenom,
        service:personConnected.data.service,
        admin:personConnected.data.admin
     });
  
      
        console.log(data);
        //res.render('AllTache', { data: data });
        //res.json(data);
    }).catch(err => console.log(err))

  }


  
});



//counteurrrr demande 
//app.get('/lastdemande',validateToken, function (req, res) {
  //Demande.find().sort({x:-1}).then((data)=> {
      //console.log(data.num_demande);
      //res.render('AllTache', { data: data });
      //res.json(data.num_demande);
  //}).catch(err => console.log(err))
//});

//-----------------Recuperation de la tache avec id -------------------------------
app.get('/tache/:id', validateToken,function (req, res) {
  var base64Url = req.cookies['access-token'].split('.')[1];
  var personConnected=JSON.parse(atob(base64Url));
  console.log("==================>"+personConnected);
  Tache.findOne({ 
      _id: req.params.id
  }).then(data => {
    //  res.render('EditTache', { data: data });
    res.json({data:data,
      nom:personConnected.data.nom ,
      prenom:personConnected.data.prenom,
      service:personConnected.data.service,
      admin:personConnected.data.admin
   });
  }).catch(err => console.log(err))
});


//----------------------Modification de la tache-------------------------------
app.put('/tache/edit/:id', upload.single('file'), function (req, res) {
  console.log(req.params.id);
  console.log(req.body);
  const Data = ({
       num_demande: req.body.num_demande, 
        employe: req.body.employe,
        service: req.body.service,
        num_tache: req.body.num_tache,
        description_tache: req.body.description_tache,
        date_prevue:req.body.date_prevue,
        date_realisation:req.body.date_realisation,
        statut:req.body.statut,
        statutFabrication:req.body.statutFabrication,
        statutAutomatisation:req.body.statutAutomatisation,
        photo:req.body.photo,
        photoFabrication:req.body.photoFabrication,
        photoAutomatisation:req.body.photoAutomatisation,
  })
  Tache.updateOne({ _id: req.params.id }, { $set: Data })
      .then(data => {
          console.log("Data updated")
          //res.redirect('/alltache')
          res.json("data updated")
      }).catch(err => console.log(err));
});

//----------------------Suppression de la tache -------------------------------
app.delete('/tache/delete/:id', function (req, res) {
  Tache.findOneAndDelete({ _id: req.params.id })
      .then(() => {
        res.redirect('http://localhost:3000/alltache');
      }).catch(err => { console.log(err) });
});
























var servire = app.listen(5000, function () {
    console.log("server listening on port 5000")

});