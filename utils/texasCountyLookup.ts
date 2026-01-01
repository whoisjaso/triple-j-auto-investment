/**
 * Texas Zip Code to County Mapping
 * Used for auto-detecting county from buyer address in PDF forms
 * Note: Some zip codes span multiple counties - we use the primary county
 */

// Comprehensive mapping of Texas zip codes to primary counties
// Focus on Houston metro area and major Texas cities
export const TEXAS_ZIP_TO_COUNTY: Record<string, string> = {
  // ===== HARRIS COUNTY (Houston) =====
  '77001': 'Harris', '77002': 'Harris', '77003': 'Harris', '77004': 'Harris', '77005': 'Harris',
  '77006': 'Harris', '77007': 'Harris', '77008': 'Harris', '77009': 'Harris', '77010': 'Harris',
  '77011': 'Harris', '77012': 'Harris', '77013': 'Harris', '77014': 'Harris', '77015': 'Harris',
  '77016': 'Harris', '77017': 'Harris', '77018': 'Harris', '77019': 'Harris', '77020': 'Harris',
  '77021': 'Harris', '77022': 'Harris', '77023': 'Harris', '77024': 'Harris', '77025': 'Harris',
  '77026': 'Harris', '77027': 'Harris', '77028': 'Harris', '77029': 'Harris', '77030': 'Harris',
  '77031': 'Harris', '77032': 'Harris', '77033': 'Harris', '77034': 'Harris', '77035': 'Harris',
  '77036': 'Harris', '77037': 'Harris', '77038': 'Harris', '77039': 'Harris', '77040': 'Harris',
  '77041': 'Harris', '77042': 'Harris', '77043': 'Harris', '77044': 'Harris', '77045': 'Harris',
  '77046': 'Harris', '77047': 'Harris', '77048': 'Harris', '77049': 'Harris', '77050': 'Harris',
  '77051': 'Harris', '77052': 'Harris', '77053': 'Harris', '77054': 'Harris', '77055': 'Harris',
  '77056': 'Harris', '77057': 'Harris', '77058': 'Harris', '77059': 'Harris', '77060': 'Harris',
  '77061': 'Harris', '77062': 'Harris', '77063': 'Harris', '77064': 'Harris', '77065': 'Harris',
  '77066': 'Harris', '77067': 'Harris', '77068': 'Harris', '77069': 'Harris', '77070': 'Harris',
  '77071': 'Harris', '77072': 'Harris', '77073': 'Harris', '77074': 'Harris', '77075': 'Harris',
  '77076': 'Harris', '77077': 'Harris', '77078': 'Harris', '77079': 'Harris', '77080': 'Harris',
  '77081': 'Harris', '77082': 'Harris', '77083': 'Harris', '77084': 'Harris', '77085': 'Harris',
  '77086': 'Harris', '77087': 'Harris', '77088': 'Harris', '77089': 'Harris', '77090': 'Harris',
  '77091': 'Harris', '77092': 'Harris', '77093': 'Harris', '77094': 'Harris', '77095': 'Harris',
  '77096': 'Harris', '77098': 'Harris', '77099': 'Harris',
  '77201': 'Harris', '77202': 'Harris', '77203': 'Harris', '77204': 'Harris', '77205': 'Harris',
  '77206': 'Harris', '77207': 'Harris', '77208': 'Harris', '77209': 'Harris', '77210': 'Harris',
  '77212': 'Harris', '77213': 'Harris', '77215': 'Harris', '77216': 'Harris', '77217': 'Harris',
  '77218': 'Harris', '77219': 'Harris', '77220': 'Harris', '77221': 'Harris', '77222': 'Harris',
  '77223': 'Harris', '77224': 'Harris', '77225': 'Harris', '77226': 'Harris', '77227': 'Harris',
  '77228': 'Harris', '77229': 'Harris', '77230': 'Harris', '77231': 'Harris', '77233': 'Harris',
  '77234': 'Harris', '77235': 'Harris', '77236': 'Harris', '77237': 'Harris', '77238': 'Harris',
  '77240': 'Harris', '77241': 'Harris', '77242': 'Harris', '77243': 'Harris', '77244': 'Harris',
  '77245': 'Harris', '77248': 'Harris', '77249': 'Harris', '77251': 'Harris', '77252': 'Harris',
  '77253': 'Harris', '77254': 'Harris', '77255': 'Harris', '77256': 'Harris', '77257': 'Harris',
  '77258': 'Harris', '77259': 'Harris', '77261': 'Harris', '77262': 'Harris', '77263': 'Harris',
  '77265': 'Harris', '77266': 'Harris', '77267': 'Harris', '77268': 'Harris', '77269': 'Harris',
  '77270': 'Harris', '77271': 'Harris', '77272': 'Harris', '77273': 'Harris', '77274': 'Harris',
  '77275': 'Harris', '77277': 'Harris', '77279': 'Harris', '77280': 'Harris', '77282': 'Harris',
  '77284': 'Harris', '77287': 'Harris', '77288': 'Harris', '77289': 'Harris', '77290': 'Harris',
  '77291': 'Harris', '77292': 'Harris', '77293': 'Harris', '77297': 'Harris', '77299': 'Harris',
  '77336': 'Harris', '77338': 'Harris', '77339': 'Harris', '77345': 'Harris', '77346': 'Harris',
  '77347': 'Harris', '77396': 'Harris', '77401': 'Harris', '77402': 'Harris',
  '77503': 'Harris', '77504': 'Harris', '77505': 'Harris', '77506': 'Harris', '77507': 'Harris',
  '77508': 'Harris', '77530': 'Harris', '77532': 'Harris', '77536': 'Harris',
  '77547': 'Harris', '77562': 'Harris', '77571': 'Harris', '77572': 'Harris',
  '77586': 'Harris', '77587': 'Harris', '77588': 'Harris', '77598': 'Harris',

  // ===== FORT BEND COUNTY =====
  '77406': 'Fort Bend', '77407': 'Fort Bend', '77417': 'Fort Bend', '77420': 'Fort Bend',
  '77430': 'Fort Bend', '77441': 'Fort Bend', '77444': 'Fort Bend', '77450': 'Fort Bend',
  '77451': 'Fort Bend', '77459': 'Fort Bend', '77461': 'Fort Bend', '77464': 'Fort Bend',
  '77469': 'Fort Bend', '77471': 'Fort Bend', '77476': 'Fort Bend', '77477': 'Fort Bend',
  '77478': 'Fort Bend', '77479': 'Fort Bend', '77481': 'Fort Bend', '77485': 'Fort Bend',
  '77487': 'Fort Bend', '77489': 'Fort Bend', '77493': 'Fort Bend', '77494': 'Fort Bend',
  '77496': 'Fort Bend', '77497': 'Fort Bend', '77498': 'Fort Bend', '77545': 'Fort Bend',

  // ===== MONTGOMERY COUNTY =====
  '77301': 'Montgomery', '77302': 'Montgomery', '77303': 'Montgomery', '77304': 'Montgomery',
  '77305': 'Montgomery', '77306': 'Montgomery', '77316': 'Montgomery', '77318': 'Montgomery',
  '77328': 'Montgomery', '77333': 'Montgomery', '77354': 'Montgomery', '77355': 'Montgomery',
  '77356': 'Montgomery', '77362': 'Montgomery', '77365': 'Montgomery', '77372': 'Montgomery',
  '77373': 'Montgomery', '77375': 'Montgomery', '77377': 'Montgomery', '77378': 'Montgomery',
  '77380': 'Montgomery', '77381': 'Montgomery', '77382': 'Montgomery', '77383': 'Montgomery',
  '77384': 'Montgomery', '77385': 'Montgomery', '77386': 'Montgomery', '77387': 'Montgomery',
  '77388': 'Montgomery', '77389': 'Montgomery', '77393': 'Montgomery',
  '77357': 'Montgomery',

  // ===== BRAZORIA COUNTY =====
  '77414': 'Brazoria', '77422': 'Brazoria', '77480': 'Brazoria',
  '77486': 'Brazoria', '77511': 'Brazoria', '77512': 'Brazoria',
  '77514': 'Brazoria', '77515': 'Brazoria', '77516': 'Brazoria', '77517': 'Brazoria',
  '77518': 'Brazoria', '77531': 'Brazoria', '77534': 'Brazoria', '77541': 'Brazoria',
  '77566': 'Brazoria', '77577': 'Brazoria', '77578': 'Brazoria',
  '77581': 'Brazoria', '77583': 'Brazoria', '77584': 'Brazoria', '77546': 'Brazoria',

  // ===== GALVESTON COUNTY =====
  '77510': 'Galveston', '77539': 'Galveston',
  '77549': 'Galveston', '77550': 'Galveston', '77551': 'Galveston',
  '77552': 'Galveston', '77553': 'Galveston', '77554': 'Galveston', '77555': 'Galveston',
  '77563': 'Galveston', '77565': 'Galveston', '77568': 'Galveston', '77573': 'Galveston',
  '77574': 'Galveston', '77590': 'Galveston', '77591': 'Galveston', '77592': 'Galveston',

  // ===== CHAMBERS COUNTY =====
  '77520': 'Chambers', '77521': 'Chambers', '77523': 'Chambers', '77560': 'Chambers',
  '77597': 'Chambers', '77582': 'Chambers',

  // ===== LIBERTY COUNTY =====
  '77326': 'Liberty', '77327': 'Liberty', '77334': 'Liberty',
  '77335': 'Liberty', '77350': 'Liberty', '77351': 'Liberty',
  '77369': 'Liberty', '77371': 'Liberty', '77399': 'Liberty',
  '77533': 'Liberty', '77535': 'Liberty', '77564': 'Liberty', '77575': 'Liberty',
  '77585': 'Liberty',

  // ===== WALLER COUNTY =====
  '77418': 'Waller', '77423': 'Waller', '77426': 'Waller', '77445': 'Waller',
  '77446': 'Waller', '77447': 'Waller', '77466': 'Waller', '77484': 'Waller',
  '77410': 'Waller', '77411': 'Waller', '77413': 'Waller', '77429': 'Waller', '77433': 'Waller',
  '77449': 'Waller',

  // ===== DALLAS COUNTY =====
  '75001': 'Dallas', '75006': 'Dallas', '75007': 'Dallas', '75011': 'Dallas',
  '75014': 'Dallas', '75015': 'Dallas', '75016': 'Dallas', '75017': 'Dallas',
  '75019': 'Dallas', '75030': 'Dallas', '75039': 'Dallas', '75040': 'Dallas',
  '75041': 'Dallas', '75042': 'Dallas', '75043': 'Dallas', '75044': 'Dallas',
  '75045': 'Dallas', '75046': 'Dallas', '75047': 'Dallas', '75048': 'Dallas',
  '75050': 'Dallas', '75051': 'Dallas', '75052': 'Dallas', '75053': 'Dallas',
  '75054': 'Dallas', '75060': 'Dallas', '75061': 'Dallas', '75062': 'Dallas',
  '75063': 'Dallas', '75080': 'Dallas', '75081': 'Dallas', '75082': 'Dallas',
  '75083': 'Dallas', '75085': 'Dallas', '75086': 'Dallas', '75087': 'Dallas',
  '75088': 'Dallas', '75089': 'Dallas', '75094': 'Dallas', '75098': 'Dallas',
  '75099': 'Dallas', '75104': 'Dallas', '75106': 'Dallas', '75115': 'Dallas',
  '75116': 'Dallas', '75123': 'Dallas', '75134': 'Dallas', '75137': 'Dallas',
  '75138': 'Dallas', '75141': 'Dallas', '75146': 'Dallas', '75149': 'Dallas',
  '75150': 'Dallas', '75159': 'Dallas', '75172': 'Dallas', '75180': 'Dallas',
  '75181': 'Dallas', '75182': 'Dallas', '75185': 'Dallas', '75187': 'Dallas',
  '75201': 'Dallas', '75202': 'Dallas', '75203': 'Dallas', '75204': 'Dallas',
  '75205': 'Dallas', '75206': 'Dallas', '75207': 'Dallas', '75208': 'Dallas',
  '75209': 'Dallas', '75210': 'Dallas', '75211': 'Dallas', '75212': 'Dallas',
  '75214': 'Dallas', '75215': 'Dallas', '75216': 'Dallas', '75217': 'Dallas',
  '75218': 'Dallas', '75219': 'Dallas', '75220': 'Dallas', '75221': 'Dallas',
  '75222': 'Dallas', '75223': 'Dallas', '75224': 'Dallas', '75225': 'Dallas',
  '75226': 'Dallas', '75227': 'Dallas', '75228': 'Dallas', '75229': 'Dallas',
  '75230': 'Dallas', '75231': 'Dallas', '75232': 'Dallas', '75233': 'Dallas',
  '75234': 'Dallas', '75235': 'Dallas', '75236': 'Dallas', '75237': 'Dallas',
  '75238': 'Dallas', '75240': 'Dallas', '75241': 'Dallas', '75242': 'Dallas',
  '75243': 'Dallas', '75244': 'Dallas', '75246': 'Dallas', '75247': 'Dallas',
  '75248': 'Dallas', '75249': 'Dallas', '75250': 'Dallas', '75251': 'Dallas',
  '75252': 'Dallas', '75253': 'Dallas', '75254': 'Dallas',

  // ===== TARRANT COUNTY (Fort Worth) =====
  '76001': 'Tarrant', '76002': 'Tarrant', '76003': 'Tarrant', '76004': 'Tarrant',
  '76005': 'Tarrant', '76006': 'Tarrant', '76007': 'Tarrant', '76008': 'Tarrant',
  '76010': 'Tarrant', '76011': 'Tarrant', '76012': 'Tarrant', '76013': 'Tarrant',
  '76014': 'Tarrant', '76015': 'Tarrant', '76016': 'Tarrant', '76017': 'Tarrant',
  '76018': 'Tarrant', '76019': 'Tarrant', '76020': 'Tarrant', '76021': 'Tarrant',
  '76022': 'Tarrant', '76028': 'Tarrant', '76034': 'Tarrant', '76036': 'Tarrant',
  '76039': 'Tarrant', '76040': 'Tarrant', '76051': 'Tarrant', '76052': 'Tarrant',
  '76053': 'Tarrant', '76054': 'Tarrant', '76058': 'Tarrant', '76059': 'Tarrant',
  '76060': 'Tarrant', '76061': 'Tarrant', '76063': 'Tarrant', '76092': 'Tarrant',
  '76094': 'Tarrant', '76095': 'Tarrant', '76096': 'Tarrant', '76097': 'Tarrant',
  '76099': 'Tarrant', '76101': 'Tarrant', '76102': 'Tarrant', '76103': 'Tarrant',
  '76104': 'Tarrant', '76105': 'Tarrant', '76106': 'Tarrant', '76107': 'Tarrant',
  '76108': 'Tarrant', '76109': 'Tarrant', '76110': 'Tarrant', '76111': 'Tarrant',
  '76112': 'Tarrant', '76113': 'Tarrant', '76114': 'Tarrant', '76115': 'Tarrant',
  '76116': 'Tarrant', '76117': 'Tarrant', '76118': 'Tarrant', '76119': 'Tarrant',
  '76120': 'Tarrant', '76121': 'Tarrant', '76122': 'Tarrant', '76123': 'Tarrant',
  '76124': 'Tarrant', '76126': 'Tarrant', '76127': 'Tarrant', '76129': 'Tarrant',
  '76130': 'Tarrant', '76131': 'Tarrant', '76132': 'Tarrant', '76133': 'Tarrant',
  '76134': 'Tarrant', '76135': 'Tarrant', '76136': 'Tarrant', '76137': 'Tarrant',
  '76140': 'Tarrant', '76147': 'Tarrant', '76148': 'Tarrant', '76150': 'Tarrant',
  '76155': 'Tarrant', '76161': 'Tarrant', '76162': 'Tarrant', '76163': 'Tarrant',
  '76164': 'Tarrant', '76166': 'Tarrant', '76177': 'Tarrant', '76179': 'Tarrant',
  '76180': 'Tarrant', '76181': 'Tarrant', '76182': 'Tarrant', '76185': 'Tarrant',
  '76191': 'Tarrant', '76192': 'Tarrant', '76193': 'Tarrant', '76195': 'Tarrant',
  '76196': 'Tarrant', '76197': 'Tarrant', '76198': 'Tarrant', '76199': 'Tarrant',
  '76244': 'Tarrant', '76248': 'Tarrant', '76262': 'Tarrant',

  // ===== BEXAR COUNTY (San Antonio) =====
  '78073': 'Bexar', '78101': 'Bexar', '78109': 'Bexar', '78112': 'Bexar',
  '78148': 'Bexar', '78150': 'Bexar', '78152': 'Bexar', '78154': 'Bexar',
  '78201': 'Bexar', '78202': 'Bexar', '78203': 'Bexar', '78204': 'Bexar',
  '78205': 'Bexar', '78206': 'Bexar', '78207': 'Bexar', '78208': 'Bexar',
  '78209': 'Bexar', '78210': 'Bexar', '78211': 'Bexar', '78212': 'Bexar',
  '78213': 'Bexar', '78214': 'Bexar', '78215': 'Bexar', '78216': 'Bexar',
  '78217': 'Bexar', '78218': 'Bexar', '78219': 'Bexar', '78220': 'Bexar',
  '78221': 'Bexar', '78222': 'Bexar', '78223': 'Bexar', '78224': 'Bexar',
  '78225': 'Bexar', '78226': 'Bexar', '78227': 'Bexar', '78228': 'Bexar',
  '78229': 'Bexar', '78230': 'Bexar', '78231': 'Bexar', '78232': 'Bexar',
  '78233': 'Bexar', '78234': 'Bexar', '78235': 'Bexar', '78236': 'Bexar',
  '78237': 'Bexar', '78238': 'Bexar', '78239': 'Bexar', '78240': 'Bexar',
  '78241': 'Bexar', '78242': 'Bexar', '78243': 'Bexar', '78244': 'Bexar',
  '78245': 'Bexar', '78246': 'Bexar', '78247': 'Bexar', '78248': 'Bexar',
  '78249': 'Bexar', '78250': 'Bexar', '78251': 'Bexar', '78252': 'Bexar',
  '78253': 'Bexar', '78254': 'Bexar', '78255': 'Bexar', '78256': 'Bexar',
  '78257': 'Bexar', '78258': 'Bexar', '78259': 'Bexar', '78260': 'Bexar',
  '78261': 'Bexar', '78263': 'Bexar', '78264': 'Bexar', '78265': 'Bexar',
  '78266': 'Bexar', '78268': 'Bexar', '78269': 'Bexar', '78270': 'Bexar',
  '78278': 'Bexar', '78279': 'Bexar', '78280': 'Bexar', '78283': 'Bexar',
  '78284': 'Bexar', '78285': 'Bexar', '78286': 'Bexar', '78287': 'Bexar',
  '78288': 'Bexar', '78289': 'Bexar', '78291': 'Bexar', '78292': 'Bexar',
  '78293': 'Bexar', '78294': 'Bexar', '78295': 'Bexar', '78296': 'Bexar',
  '78297': 'Bexar', '78298': 'Bexar', '78299': 'Bexar',

  // ===== TRAVIS COUNTY (Austin) =====
  '78617': 'Travis', '78652': 'Travis', '78653': 'Travis', '78660': 'Travis',
  '78701': 'Travis', '78702': 'Travis', '78703': 'Travis', '78704': 'Travis',
  '78705': 'Travis', '78708': 'Travis', '78709': 'Travis', '78710': 'Travis',
  '78711': 'Travis', '78712': 'Travis', '78713': 'Travis', '78714': 'Travis',
  '78715': 'Travis', '78716': 'Travis', '78717': 'Travis', '78718': 'Travis',
  '78719': 'Travis', '78720': 'Travis', '78721': 'Travis', '78722': 'Travis',
  '78723': 'Travis', '78724': 'Travis', '78725': 'Travis', '78726': 'Travis',
  '78727': 'Travis', '78728': 'Travis', '78729': 'Travis', '78730': 'Travis',
  '78731': 'Travis', '78732': 'Travis', '78733': 'Travis', '78734': 'Travis',
  '78735': 'Travis', '78736': 'Travis', '78737': 'Travis', '78738': 'Travis',
  '78739': 'Travis', '78741': 'Travis', '78742': 'Travis', '78744': 'Travis',
  '78745': 'Travis', '78746': 'Travis', '78747': 'Travis', '78748': 'Travis',
  '78749': 'Travis', '78750': 'Travis', '78751': 'Travis', '78752': 'Travis',
  '78753': 'Travis', '78754': 'Travis', '78755': 'Travis', '78756': 'Travis',
  '78757': 'Travis', '78758': 'Travis', '78759': 'Travis',

  // ===== EL PASO COUNTY =====
  '79901': 'El Paso', '79902': 'El Paso', '79903': 'El Paso', '79904': 'El Paso',
  '79905': 'El Paso', '79906': 'El Paso', '79907': 'El Paso', '79908': 'El Paso',
  '79910': 'El Paso', '79911': 'El Paso', '79912': 'El Paso', '79913': 'El Paso',
  '79914': 'El Paso', '79915': 'El Paso', '79916': 'El Paso', '79917': 'El Paso',
  '79918': 'El Paso', '79920': 'El Paso', '79922': 'El Paso', '79923': 'El Paso',
  '79924': 'El Paso', '79925': 'El Paso', '79926': 'El Paso', '79927': 'El Paso',
  '79928': 'El Paso', '79929': 'El Paso', '79930': 'El Paso', '79931': 'El Paso',
  '79932': 'El Paso', '79934': 'El Paso', '79935': 'El Paso', '79936': 'El Paso',
  '79937': 'El Paso', '79938': 'El Paso',

  // ===== COLLIN COUNTY =====
  '75002': 'Collin', '75009': 'Collin', '75013': 'Collin', '75023': 'Collin',
  '75024': 'Collin', '75025': 'Collin', '75026': 'Collin', '75034': 'Collin',
  '75035': 'Collin', '75069': 'Collin', '75070': 'Collin',
  '75071': 'Collin', '75072': 'Collin', '75074': 'Collin', '75075': 'Collin',
  '75078': 'Collin', '75093': 'Collin',
  '75164': 'Collin', '75166': 'Collin', '75173': 'Collin', '75189': 'Collin',
  '75407': 'Collin', '75409': 'Collin', '75424': 'Collin', '75442': 'Collin', '75454': 'Collin',

  // ===== DENTON COUNTY =====
  '75010': 'Denton', '75022': 'Denton', '75027': 'Denton',
  '75028': 'Denton', '75029': 'Denton', '75033': 'Denton',
  '75056': 'Denton', '75057': 'Denton', '75065': 'Denton', '75067': 'Denton',
  '75068': 'Denton', '75077': 'Denton',
  '76201': 'Denton', '76202': 'Denton', '76203': 'Denton', '76204': 'Denton',
  '76205': 'Denton', '76206': 'Denton', '76207': 'Denton', '76208': 'Denton',
  '76209': 'Denton', '76210': 'Denton', '76226': 'Denton', '76227': 'Denton',
  '76234': 'Denton', '76247': 'Denton', '76249': 'Denton', '76258': 'Denton',
  '76259': 'Denton', '76266': 'Denton', '76272': 'Denton',

  // ===== HIDALGO COUNTY (McAllen/Rio Grande Valley) =====
  '78501': 'Hidalgo', '78502': 'Hidalgo', '78503': 'Hidalgo', '78504': 'Hidalgo',
  '78505': 'Hidalgo', '78516': 'Hidalgo', '78537': 'Hidalgo', '78538': 'Hidalgo',
  '78539': 'Hidalgo', '78540': 'Hidalgo', '78541': 'Hidalgo', '78542': 'Hidalgo',
  '78543': 'Hidalgo', '78549': 'Hidalgo', '78557': 'Hidalgo', '78558': 'Hidalgo',
  '78559': 'Hidalgo', '78560': 'Hidalgo', '78561': 'Hidalgo', '78562': 'Hidalgo',
  '78563': 'Hidalgo', '78564': 'Hidalgo', '78565': 'Hidalgo', '78567': 'Hidalgo',
  '78568': 'Hidalgo', '78569': 'Hidalgo', '78570': 'Hidalgo', '78572': 'Hidalgo',
  '78573': 'Hidalgo', '78574': 'Hidalgo', '78576': 'Hidalgo', '78577': 'Hidalgo',
  '78578': 'Hidalgo', '78579': 'Hidalgo', '78580': 'Hidalgo', '78583': 'Hidalgo',
  '78584': 'Hidalgo', '78588': 'Hidalgo', '78589': 'Hidalgo', '78591': 'Hidalgo',
  '78595': 'Hidalgo', '78596': 'Hidalgo', '78599': 'Hidalgo',
};

/**
 * Get Texas county from zip code
 */
export function getTexasCountyFromZip(zip: string): string | null {
  const cleanZip = zip?.replace(/\D/g, '').substring(0, 5);
  if (!cleanZip || cleanZip.length !== 5) return null;
  return TEXAS_ZIP_TO_COUNTY[cleanZip] || null;
}

/**
 * Extract zip code from address string
 */
export function extractZipFromAddress(address: string): string | null {
  if (!address) return null;
  // Match 5-digit zip, optionally with -4 extension
  const zipMatch = address.match(/\b(\d{5})(?:-\d{4})?\b/);
  return zipMatch ? zipMatch[1] : null;
}

/**
 * Get county from full address string by extracting zip code
 */
export function getCountyFromAddress(address: string): string | null {
  const zip = extractZipFromAddress(address);
  if (!zip) return null;
  return getTexasCountyFromZip(zip);
}

/**
 * Parse address into structured components
 */
export interface ParsedAddress {
  street: string;
  city: string;
  state: string;
  zip: string;
  county: string | null;
  fullAddress: string;
}

export function parseAddress(displayName: string): ParsedAddress {
  if (!displayName) {
    return { street: '', city: '', state: 'TX', zip: '', county: null, fullAddress: '' };
  }

  // Parse: "123 Main St, Houston, TX 77001, United States"
  const parts = displayName.split(',').map(p => p.trim());

  // Get street (first part)
  const street = parts[0] || '';

  // Get city (second part)
  const city = parts[1] || '';

  // Get state and zip from third part
  const stateZipPart = parts[2] || '';
  const stateMatch = stateZipPart.match(/([A-Z]{2})\s*(\d{5}(?:-\d{4})?)?/);
  const state = stateMatch?.[1] || 'TX';
  const zip = stateMatch?.[2] || extractZipFromAddress(displayName) || '';

  // Get county from zip
  const county = zip ? getTexasCountyFromZip(zip) : null;

  // Build full address
  const fullAddress = [street, city, `${state} ${zip}`.trim()].filter(Boolean).join(', ');

  return { street, city, state, zip, county, fullAddress };
}
