//
//   ReactMineur² projet DWWM ©2024 HPSdevs, 15/07/24-22/07/24
//
// IMPORT MODE
import { useState,useEffect} from "react";
import s           from "./App.module.scss";
import grass       from "../src/assets/images/grass.svg";
import flag        from "../src/assets/images/flag.svg";
import mineexp     from "../src/assets/images/mineexp.svg";
import mine        from "../src/assets/images/mine.svg";
import pick        from "../src/assets/images/pick.svg";
import reset       from "../src/assets/images/reset.svg";
import help        from "../src/assets/images/help.svg";
import fxsoundflag from "../src/assets/sounds/flag.mp3";
import fxsoundlose from "../src/assets/sounds/lose.mp3";
import fxsoundplay from "../src/assets/sounds/play.mp3";
import fxsoundwins from "../src/assets/sounds/win.mp3";
import fxsounddigs from "../src/assets/sounds/dig.mp3";
import fxsoundswap from "../src/assets/sounds/swap.mp3";

// START APP
export default function App() {
  // initialisation sounds
  const soundflag = new Audio(fxsoundflag); 
  const soundlose = new Audio(fxsoundlose); 
  const soundplay = new Audio(fxsoundplay); 
  const soundwins = new Audio(fxsoundwins); 
  const sounddigs = new Audio(fxsounddigs); 
  const soundswap = new Audio(fxsoundswap); 
  // initialisation des variables
  const [redrawed,setredraw]         = useState ();                    
  const [champs,setChamps]           = useState ();                    
  const [nbflag,setNbflag]           = useState (0);                   
  const [nbmine,setNbmine]           = useState (0);                   
  const [status,setStatus]           = useState (0);                   
  const [niveau,setNiveau]           = useState (1);                   
  const [taille,setTaille]           = useState (10);                   
  const [tool  ,setTool]             = useState (0);                   
  const [gametimer, setGameTimer]    = useState (0);                       
  const [gamehelp , setGamehelp ]    = useState (false);                       
  const [buttondisabled, chgbuttonDisabled] = useState(false); 
  const etatjeu = [ "CLICK TO START","GAME RUNNING…","RESTART","RESTART"];   
  const autour  = [ [0,-1],[1,-1],[1,0],[1,1],[0,1],[-1,1],[-1,0],[-1,-1]]; 

  // INFO contenu CHAMPS[], une case = {sol: objet au sol (herbe ou flag), terre: bombe ou non,  nb: 0 (sert à la proximité)} 

  // INIT 
  useEffect(()=>{   initialisation();  },[])                      // juste pour avoir le champ affiché dès le lancement
  useEffect(()=>{                                                 // timer du jeu
    const reviens = setInterval(() => runningtime() , 1000);
    return () => clearInterval(reviens);
  },[status])
  
  
  // temps de jeu
  function setstarttime(){
    setGameTimer(0);
  }
  function runningtime(){
    if (status==1) { 
      setGameTimer((gametimer)=>++gametimer);
    }
  }

  // réaffichage quand je le Veux !
  function redraw(){
    setredraw (Math.random()*1000 )
  }

  // base start/stop
  function handleStart(){
    switch (status) {
      case 0:     // START
        dostart();
        break;
      default:    // STOP/RESET/WIN/LOSE
        DoSTOP(0);
        break;
      }
  }
  function dostart(){      // groupement cmds to…
    chgbuttonDisabled(true);
    initialisation();
    handleTool(0);
    setstarttime();
    soundplay.play();
    setStatus(1);
    document.getElementById(`start`).classList.add("running");
  }
  function DoRESET(){
    setStatus(0);
    chgbuttonDisabled(false);
    initialisation();
    handleTool(0);
  }
  function DoSTOP(x){
    setStatus(x);
    endtools();
    chgbuttonDisabled(false);
  }
  
  // handle des boutons des outils, niveaux
  function handleTool(x){
    let a=1-x;
    document.getElementById(`tool${a}`).classList.remove("encours");
    document.getElementById(`tool${x}`).classList.add("encours");
    if (status===1) soundswap.play();
    setTool(x);
  }
  function handleNiveau(x){
    setNiveau((niveau)=> ( (niveau===1 && x<0)? niveau : (niveau===9 && x>0) ? niveau : niveau+x));
  }
  function endtools(){    // End of visual Effect
    setTool(0);
    document.getElementById(`tool0`).classList.remove("encours"); 
    document.getElementById(`tool1`).classList.remove("encours");
    document.getElementById(`start`).classList.remove("running");
  }
  ///////////////////////////////////////////// LE JEU
  function initialisation(){
    const surface = taille**2;                                              // nombre de cases
    const nbm = Math.floor(surface*niveau/20);                              // % de mines par rapport aux cases + alea
    setNbflag(nbm);                                                         // nombre de drapeau disponible
    setNbmine(nbm);                                                         // nombre de mines (même)
    let field = MettreMines(nbm);  
    setChamps(field);                                                        
    redraw();  
  } 
  // affectation aléatoire des mines
  function MettreMines(nbm){
    const field = Array.from(Array(taille), () => new Array(taille).fill({sol:"herbe",terre:"terre",nb:0}));
    for (let i = 0; i < nbm;i++) {
      let c,x,y = null;
      do { 
          x= Number(Math.floor( Math.random()*taille));
          y= Number(Math.floor( Math.random()*taille));
          c= field[y][x].terre;
        } while (c==="mine")      // ne pas mettre une mine là ou il y en a déjà une ! sinon BOOOM!!!!
        autour.forEach((pos)=>{   //  si ok alors faire de suite l'entourage de valeurs
          const xx = x+pos[0]<0 ? "OUT" : x+pos[0]>(taille-1) ? "OUT" : x+pos[0];
          const yy = y+pos[1]<0 ? "OUT" : y+pos[1]>(taille-1) ? "OUT" : y+pos[1];
          const zz = xx!="OUT" && yy!="OUT";
            if (zz) { 
              let old= field[yy][xx];
              field[yy][xx] = {...old, nb: old.nb+1}; //  garder les autres valeurs tout en mettant celle-ci+1
            } 
          }
        )
        field[y][x]={sol:"herbe",terre:"mine", value: 0}; // mettre la mine là prévu.
      }
      return field;
  }
  // regarde selon l'outil
  function Look(x,y){
    if (status===0){dostart()}  // Start sans le bouton start
    if (status===1){
      const vue= champs[y][x];
      if (vue.nb   ===0) Search(x,y);   // si rien faire l'auto Search
      if (vue.terre==="mine"  && tool===0){ soundlose.play(); setground(x,y,"mineexp"); DoSTOP(2);}
      if (vue.sol  ==="herbe" && tool===0){ sounddigs.play(); setsol(x,y,"terre")}
      if (vue.sol  ==="flag"  && tool===1){ soundflag.play(); setsol(x,y,"herbe")}
      if (vue.sol  ==="herbe" && tool===1 && nbflag>0){ soundflag.play(); setsol(x,y,"flag")}
    }
  }
  // La partie récursive: l'auto Search
  function Search(x,y){
         const field= champs;
         autour.forEach((pos)=>{ 
          const xx = x+pos[0]<0 ? "OUT" : x+pos[0]>(taille-1) ? "OUT" : x+pos[0];
          const yy = y+pos[1]<0 ? "OUT" : y+pos[1]>(taille-1) ? "OUT" : y+pos[1];
          const zz = xx!="OUT" && yy!="OUT";
            if (zz) { 
              let vue= field[yy][xx];
              if  (vue.sol==="herbe") {
                    setsol (xx,yy,"terre"); 
                    if (vue.nb===0){Search(xx,yy)}
                  }
            }
          }) 
          return
  }
  // changement du sol   
  function setsol(x,y,objet){
    if (objet==="flag" ){ setNbflag((a)=> --a)}
    if (objet==="herbe"){ setNbflag((a)=> ++a)}
    const field= champs;
    field[y][x] = {...field[y][x], sol: objet};
    setChamps(field);
    redraw(); 
    andTheWinnerIs();      
  }
  // changement de la terre   
  function setground(x,y,objet){
    const field= champs;
    field[y][x] = {...field[y][x], terre: objet};
    setChamps(field);
    redraw();     
  }
  // Check si gagnant
  function andTheWinnerIs (){
    let win = 0;
          champs.map((row) =>   
              row.map((carre) =>  
                  { if (carre.sol==="flag" && carre.terre==="mine") { ++win} }
              )
          )
    if (win === nbmine) {soundwins.play();DoSTOP(3)}
  }
  // affichage du sol
  function ShowSol({place}){
    if (status===2){   // si perdu
      switch (place.terre) {  
        case "mine":
          return <img className="icons" src={mine}/>
        case "mineexp":
          return <img className="large coming" src={mineexp}/>
      }
    }                       
    switch (place.sol) {              
      case "herbe":
        return <img className="icons" src={grass}/>
      case "flag":
        return <img className="icons" src={flag}/>
      default:
        return place.nb >0 ? place.nb : "";
    }
  }
  // affichage de base
  function Perdu(){
    return(
        <div className="fondinfo" onClick={()=>DoRESET()}>
          <div className="info" onClick={()=>DoRESET()}>
            <h3>VOUS AVEZ PERDU</h3>
            <h6>en {gametimer} secondes</h6>
          </div>
        </div>
    )
  } 
  function Gagne(){
    return(
        <div className="fondinfo" onClick={()=>DoRESET()}>
          <div className="info" onClick={()=>DoRESET()}>
            <h3>VOUS AVEZ GAGNÉ</h3>le niveau {niveau}
            <h6>en {gametimer} secondes</h6>
            <span>copie l'écran et partage ton super score !</span>
          </div>
        </div>
    )
  }
    function Aide(){
    return(
        <div className="fondinfo" onClick={()=>setGamehelp(false)}>
          <div className="aide" onClick={()=>setGamehelp(false)}>
            <h3>&nbsp;<span>Comment jouer ?</span></h3>
            <p>Le joueur doit découvrir toutes les mines dans le champs de mines.</p><p><span>Pour gagner :</span> placer tous les drapeaux sur les emplacements supposés minés, si le joueur découvre une case cachant une mine, la partie est perdue.</p><p><span>chiffres ?</span> Si le joueur découvre une case vide, un chiffre correspondant au nombre de mines présentes sous les huit cases adjacentes apparaît.</p>
          </div>
        </div>
    )
  }
  function Hms() {
    const sec =  gametimer;
    let heures   = Math.floor(sec / 3600); 
    let minutes = Math.floor((sec - (heures * 3600)) / 60); 
    let secondes= Math.floor(sec - (heures * 3600) - (minutes * 60)); 
    if (heures    < 10) {heures   = "0"+heures;}
    if (minutes  < 10) {minutes  = "0"+minutes;}
    if (secondes < 10) {secondes = "0"+secondes;}
    return (status<1) ?  "00:00:00" : heures+':'+minutes+':'+secondes; 
}
  ///////////////////////////////////////////// AFFICHAGE
  return (
    <>
      <div className="game">

      {/* TITRE */}
      <div className="fondtitle">
        <div className="title">
          <h1>DMineur²&nbsp;62</h1>
          <h6><span>©2024 by HPSdevs</span>&nbsp; SOFIP TP DWWM</h6>
        </div>
        <img className="help" src={help} onClick={()=>setGamehelp(true)}/>
      </div>

      {/* INFOS */}
      {status===2 && <Perdu/>}
      {status===3 && <Gagne/>}
      {gamehelp && <Aide/>}

      {/* FIELDS */} 
      <div className="champ">
        <>
          {champs && champs.map((row, j) =>   
            <ul key={j}>
            {row.map((carre, i) => ( 
              <li key={j*3100+i} className={carre.sol} onClick={()=>Look(i,j)}><ShowSol place={carre}/></li> ) )}    
            </ul>
          )}
        </>
      </div>
      {/* COMMANDS */}
      <div className={`${s.commands}`}>
   
        <div className={`${s.panels}`}>
          <div className="ledligne">
            <div className="ledtext" title={etatjeu[status]}>{etatjeu[status]}</div>
            <div className="ledinfo" title={gametimer}><Hms/></div>
            <div className="ledlvi">Niv</div>
            <div className="ledlvl">{niveau}</div>
          </div>
          <div>
            <button className="top niveau" title="increase the level" onClick={()=>handleNiveau(1)} disabled={buttondisabled}>
              <div className="txtniv">Niv +</div></button>
            <button className="dwn niveau" title="lower the level" onClick={()=>handleNiveau(-1)} disabled={buttondisabled}>
              <div className="txtniv">Niv -</div></button>
          </div>
        </div>

        <div className={`${s.tools}`}>
          <button title="START/RESET" className="all tool bttools" onClick={()=>handleStart()}><img id="start" className="toolimage" src={reset}/></button>
          <button id="tool0" title="use pick"    className="all tool bttools" onClick={()=>handleTool(0)}><img className="toolimage" src={pick}/></button>
          <button id="tool1" title="use flag"    className="all tool bttools" onClick={()=>handleTool(1)}><img className="toolflag" src={flag}/>
          <div className="tooltext niveau">{nbflag}<br/>{nbflag>1 ? "mines":"mine"}</div>
          </button>
        </div>
        </div>
        <i className="redraw">S:{status} T:{gametimer} A:{redrawed}</i>
      </div> 
    </>
  );
}