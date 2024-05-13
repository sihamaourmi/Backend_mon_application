
var express = require('express');
var app = express();


//le path c'est pour le html on aura pas besoin ici
var path = require('path'); 

//dotenv: C'est un outil tres utile por changer des variables d'environnement a partir d'un fichier .env dans les applications 
require('dotenv').config();

//Method Override:est un middleware utile pour les applications Expess qui doivent simuler des methode HTTP PUT et DELETE en utilisant des requetes Get ou Post 
const methodoverride = require('method-override')
app.use(methodoverride('_method'))

//Brypt : c'est une bibaliotheque de hachage de mots de passe utilisée pour sécuriser les informations d'authentification dans les applications 
const bcrypt = require('bcrypt')

//Connexion à la base de données
const url = process.env.DATABASE_URL

//Mongoose:sert a simplifier l'interaction avec Mongodb en ajoutant des fonctionnalites de modélisation.de validation et de gestion de données 
var mongoose = require('mongoose'); 

//bodyparser:est un outil essentiel pour les applications Node.js pour faciliter la gestion des données envoyées dans le corps des requetes HTTP
 //HTTP :c'est un protocole qui gére la communication entre le Backend et le Fontend 
var bodyParser = require('body-parser');
app.use(bodyParser.urlencoded({ extended: false }));

//le module

const Demande = require('./models/Demande');
const Tache = require('./models/Tache');
const Utilisateur = require('./models/Utilisateur');



//Connexion à la base de données
mongoose.connect(url, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
}).then(console.log("MongoDB connected !"))
    .catch(err => console.log(err))

    app.set('view engine', 'ejs');


    //cookier parcser:c'est un outil essentiel pour les applications Node.js et Express qui facilite la gestion des cookies HTTP.
    //Les cookies sont les petites morceux de données stockés sur le navigateur de l'utilisateur et envoyer avec chaque requete HTTP vers le serveur 
const cookieParser = require ('cookie-parser');
app.use(cookieParser())
const {createToken,validateToken} = require ('./JWT');

// toobusy-js: s'il ya trop de connexion sur le serveur il va envoyer un msg erreur "Serveur trop occupé"
const toobusy = require('toobusy-js');

app.use(function(req, res, next) {
if (toobusy()) {
res.status(503).send("Serveur trop occupé");
} else {
next();
}
});

const session = require('express-session');
const svgCaptcha = require('svg-captcha');


//c'est la partie sauvgarder de la session 
app.use(
  session({
  secret: 'my-secret-key', // Clé secrète pour signer la session 
  resave: false,
  saveUninitialized: true,
  })
  )

  app.get('/captcha', (req, res) => {
    // Génère un captcha SVG avec le module svg-captcha
    const captcha = svgCaptcha.create();
    // Stocke la valeur du captcha dans la session
    req.session.captcha = captcha.text;
    // Renvoie le captcha SVG en réponse
    res.type('svg');
    res.status(200).send(captcha.data);
    });
    
// Endpoint pour vérifier le captcha
app.post('/verify', (req, res) => {
const { userInput } = req.body;
// Vérifie si la valeur saisie par l'utilisateur correspond au captcha stocké dans la session
if (userInput === req.session.captcha) {
res.status(200).send('Captcha is valid!');
} else {
res.status(400).send('Captcha is invalid!');
}
})
//c'est pour les modification des parametre HTTP  on a deja installe hpp sur le back 
const hpp = require('hpp');

app.use(hpp())


//c'est pour les modification des parametre HTTP  on a deja installe helmet sur le back 
const helmet = require("helmet");

//app.use(helmet()); 


//Authentification
//cors:permet de recuperer des donnees qui vient des sites exterieures;il autorise l'acces et le pouvoir de recuperer le TOken et de permettre a se connecter
//cors:est un outil essentiel pour gerer les probleme de securite liés aux requetes entre domaine differents dans les applications web 
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






//Multer: "pour les images"est un outil essentiel pour les applications Express qui necessitent le telechargement de fichier depuis le client vers le serveur il facilite la gestion des fichiers telecharger  
const multer = require('multer');

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
            imagename:req.body.imagename,
            admin:req.body.admin
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
          //on a met les 2 var pour recuperer les informations de la personne connecter stocker dans le cocker sur le navigateur qui va nous servir de gerer les acces , afficher et cacher "les bouttons"
          var base64Url = req.cookies['access-token'].split('.')[1];
          var personConnected=JSON.parse(atob(base64Url));
            console.log(data);
            // res.render('AllUtilisateur', { data: data });
            res.json({data:data,
              nom:personConnected.data.nom ,
              prenom:personConnected.data.prenom,
              service:personConnected.data.service,
              admin:personConnected.data.admin,
              image:personConnected.data.imagename

           });
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
            password: bcrypt.hashSync(req.body.password, 10),
            imagename:req.body.imagename
        })
        Utilisateur.updateOne({ _id: req.params.id }, { $set: Data })
        //set:sert a modifier les data de la basse de donnes par les Data envoyer 
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
      console.log("==============>");
      console.log(req.body.nom);
        Utilisateur.findOne({
            nom: req.body.nom
        }).then((utilisateur) => {
            if (!utilisateur){
              console.log("======/////========>");
      console.log(utilisateur);
                // si le Password et correcte et le  Username pas correcte on affiche
                res.send('Aucun utilisateur trouvé')
            }
            console.log("----------------------");
            console.log(req.body.password);
            console.log(utilisateur.password);
            if (!bcrypt.compareSync(req.body.password,utilisateur.password)) {
                 // si le Username et correcte et le mot pass pas correcte on affiche
                 res.send("Mot de passe incorrect!"); 
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
res.redirect('http://localhost:3000/login') 
});
    
    //...............Page Demande................
    //----------------------Routes-------------------------------


    //----------------------Nouvelle Demande-------------------------------
    app.get('/new-demande',validateToken, function (req, res) {
        res.render('NewDemande');
    });

//-----------------Enregistrement de la demande sur la base de donne-------------------------------
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
                element.indiceFabri=tache.filter(e=>(e.statut=="Terminer" && e.statutFabrication!=="Terminer" &&
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
          admin:personConnected.data.admin,
          image:personConnected.data.imagename
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


    app.put('/demande/editM/:id', upload.single('file'), function (req, res) {
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
        statut:req.body.statut,
        image:req.body.image
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
        statutAutomatisation:req.body.service==="Automatisation"? req.body.statut:"",
        photo:req.body.service==="Automatisation"? "":req.body.photo,
        photoFabrication:req.body.photoFabrication,
        photoAutomatisation:req.body.service==="Automatisation"? req.body.photo:"",


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
        admin:personConnected.data.admin,
        image:personConnected.data.imagename
        

     });
    }).catch(err => console.log(err))

  });


//validateToken:Pour authentification 
app.get('/alltache/:num_demand',validateToken, function (req, res) {

  var base64Url = req.cookies['access-token'].split('.')[1];
  var personConnected=JSON.parse(atob(base64Url));

  console.log("========jkjkjk=====>"+req.params.num_demand);
  if(personConnected.data.service=="admin" || personConnected.data.service=="Assemblage"){
    Tache.find().then((data)=> {
      data=data.filter(e=> req.params.num_demand==e.num_demande);

      console.log(data);
      //res.render('AllDemande', { data: data });          
  
  res.json({data:data,
        nom:personConnected.data.nom ,
        prenom:personConnected.data.prenom,
        service:personConnected.data.service,
        admin:personConnected.data.admin,
        image:personConnected.data.imagename
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
        admin:personConnected.data.admin,
        image:personConnected.data.imagename
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
        admin:personConnected.data.admin,
        image:personConnected.data.imagename
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
        admin:personConnected.data.admin,
        image:personConnected.data.imagename
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
        
        date_prevue_F:req.body.date_prevue_F,
        date_realisation_F:req.body.date_realisation_F,
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
  console.log("=================>");
  console.log(req.param);
  var idT=req.params.id.split('-')[0];
  var idD=req.params.id.split('-')[1];
  Tache.findOneAndDelete({ _id: idT})
      .then(() => {
        res.redirect('http://localhost:3000/alltache/'+idD);
      }).catch(err => { console.log(err) });
});
























var servire = app.listen(5000, function () {
    console.log("server listening on port 5000")

});

module.exports = app;