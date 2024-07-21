//
//   ReactMineur projet DWWM ©2024 HPSdevs, 15/07/24-18/07/24
//
// IMPORT MODE
import { useState,useEffect} from "react";
import s from "./App.module.scss";
import grass from "../src/assets/images/grass.svg";
import flag  from "../src/assets/images/flag.svg";
import mine  from "../src/assets/images/mine.svg";
import pick  from "../src/assets/images/pick.svg";
import reset  from "../src/assets/images/reset.svg";
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
  const [gametimer, setGameTimer]            = useState (0);                       
  const [buttondisabled, chgbuttonDisabled] = useState(false); 
  const etatjeu = [ "CLICK TO START","GAME RUNNING…","RESTART","RESTART"];   
  const autour  = [ [0,-1],[1,-1],[1,0],[1,1],[0,1],[-1,1],[-1,0],[-1,-1]]; 
  // INFO contenu case = {sol: objet, terre: bombe,  nb: 0 } 

  // INIT juste pour avoir le champ affiché dès le lancement
  useEffect(()=>{   initialisation();  },[])
  useEffect(()=>{   
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
  function endtools(){
    setTool(0);
    document.getElementById(`tool0`).classList.remove("encours"); // arrete les mouvements
    document.getElementById(`tool1`).classList.remove("encours");
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
      default:  // STOP/RESET/WIN/LOSE
        DoSTOP(0);
        break;
      }
  }
  function dostart(){
    chgbuttonDisabled(true);
    initialisation();
    handleTool(0);
    setstarttime();
    soundplay.play();
    setStatus(1);
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
  /////////////////////////////////////////////
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
      if (vue.terre==="mine"  && tool===0){ soundlose.play(); DoSTOP(2);}
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
    if (status===2){
       if (place.terre==="mine") return <img className="icons coming" src={mine}/>
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
  function Hms() {
    const sec =  gametimer;
    let hours   = Math.floor(sec / 3600); 
    let minutes = Math.floor((sec - (hours * 3600)) / 60); 
    let seconds = Math.floor(sec - (hours * 3600) - (minutes * 60)); 
    if (hours   < 10) {hours   = "0"+hours;}
    if (minutes < 10) {minutes = "0"+minutes;}
    if (seconds < 10) {seconds = "0"+seconds;}
    return (status<1) ?  "00:00:00" : hours+':'+minutes+':'+seconds; 
}
  // AFFICHAGE
  return (
    <>
      <div className="game">

      {/* TITRE */}
      <div className="fondtitle">
        <div className="title">
          <h1><span>DMineur&nbsp;62</span></h1>
          <h6><span>©2024 by HPSdevs</span>&nbsp; @ TP DWWM SOFIP Béthune</h6>
        </div>
      </div>

      {/* INFOS */}
      {status===2 && <Perdu/>}
      {status===3 && <Gagne/>}

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
            <div className="ledlvi">LvL</div>
            <div className="ledlvl">{niveau}</div>
          </div>
          <div>
            <button className="top niveau" title="increase the level" onClick={()=>handleNiveau(1)} disabled={buttondisabled}>Niv +</button>
            <button className="dwn niveau" title="lower the level" onClick={()=>handleNiveau(-1)} disabled={buttondisabled}>Niv -</button>
          </div>
        </div>

        <div className={`${s.tools}`}>
          <button id="start" title="START/RESET" className="all tool bttools" onClick={()=>handleStart()}><img className="toolimage" src={reset}/></button>
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