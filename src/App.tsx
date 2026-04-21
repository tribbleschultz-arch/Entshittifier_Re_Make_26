import { useEffect, useState, useMemo } from 'react';
import { motion, AnimatePresence, LayoutGroup } from 'motion/react';
import { ChevronDown, RotateCcw } from 'lucide-react';
import { Question, ScoreImpact, EinordnungData, ZoneInfo } from './types';
import { ScoreBlob } from './components/ScoreBlob';

type AnswerOption = 'yes' | 'no' | 'dont_know';

export default function App() {
  const [questions, setQuestions] = useState<Question[]>([]);
  const [zones, setZones] = useState<EinordnungData | null>(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, AnswerOption>>({});
  const [isFinished, setIsFinished] = useState(false);
  const [openDetails, setOpenDetails] = useState<Record<string, boolean>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isTransitioning, setIsTransitioning] = useState(false);

  const fetchQuestions = async () => {
    setLoading(true);
    setError(null);
    try {
      const [resQ, resZ] = await Promise.all([
        fetch(`/questions.json?t=${new Date().getTime()}`),
        fetch(`/einordnung.json?t=${new Date().getTime()}`)
      ]);
      
      if (!resQ.ok || !resZ.ok) throw new Error('Failed to fetch data');
      
      const dataQ = await resQ.json();
      const dataZ = await resZ.json();
      
      setQuestions(dataQ.questions);
      setZones(dataZ);
    } catch (err: any) {
      setError(err.message || 'Ein Fehler ist aufgetreten');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchQuestions();
  }, []);

  const currentScore = useMemo(() => {
    let x = 0;
    let y = 0;
    questions.forEach((q) => {
      const ans = answers[q.id];
      if (ans) {
        x += q[ans].x;
        y += q[ans].y;
      }
    });
    return { x, y };
  }, [answers, questions]);

  // Hardcoded constraints requested: -15 to 15
  const MAX_ABS = 15;

  // Bounded Absolute Scores
  const boundedX = useMemo(() => Math.max(-MAX_ABS, Math.min(MAX_ABS, currentScore.x)), [currentScore.x]);
  const boundedY = useMemo(() => Math.max(-MAX_ABS, Math.min(MAX_ABS, currentScore.y)), [currentScore.y]);

  const normX = boundedX / MAX_ABS;
  const normY = boundedY / MAX_ABS;

  // Determine Active Zone based directly on the mathematical boundaries of the sketch
  const activeZone = useMemo(() => {
    if (!zones) return null;

    // Is it in the newly sculpted Sufficiency boundary?
    // The curve goes from (-15, 14) to (0, 13)
    // Then a circular arc (r=13) from (0, 13) to (13, 0)
    // Then a line from (13, 0) to (14, -15)
    const isSuffizient = (() => {
      // Top Left Area: check if Y is above the line y = 13 - x/15
      if (boundedX <= 0) return boundedY >= 13 - (boundedX / 15);
      
      // Top Right Area: check if it's over the radial boundary of 13
      if (boundedX > 0 && boundedY > 0) return (boundedX * boundedX + boundedY * boundedY) >= 169; // 13^2 = 169
      
      // Bottom Right Area: check if X is to the right of the line x = 13 - y/15
      if (boundedY <= 0) return boundedX >= 13 - (boundedY / 15);
      
      return false;
    })();

    if (isSuffizient) return zones.top_right_suffizient;
    
    // Center Radius: Zu wenige infos (r <= 3.0 out of 15)
    const distFromCenter = Math.sqrt(boundedX * boundedX + boundedY * boundedY);
    if (distFromCenter <= 3.0) return zones.center_neutral;

    // Remaining spaces bound to the hard quadrants
    if (boundedX < 0 && boundedY < 0) return zones.bottom_half; // Bottom-left (Konsumgesteuerte artif. Bedarfe)
    if (boundedX >= 0 && boundedY < 0) return zones.top_left; // Bottom-right also maps to Schwaches Potential
    if (boundedX < 0 && boundedY >= 0) return zones.top_left; // Top-left maps to Schwaches Potential
    if (boundedX >= 0 && boundedY >= 0) return zones.top_right_potential; // Remaining top-right inside arc

    return null;
  }, [boundedX, boundedY, zones]);

  const handleAnswer = (option: AnswerOption) => {
    if (isTransitioning) return;

    const currentQ = questions[currentIndex];
    if (!currentQ) return;

    setAnswers((prev) => ({ ...prev, [currentQ.id]: option }));
    setIsTransitioning(true);

    if (currentIndex < questions.length - 1) {
      setTimeout(() => {
        setCurrentIndex((prev) => Math.min(prev + 1, questions.length - 1));
        setOpenDetails({});
        setIsTransitioning(false);
      }, 400); 
    } else {
      setTimeout(() => {
        setIsFinished(true);
        setIsTransitioning(false);
      }, 400);
    }
  };

  const handleRestart = () => {
    setAnswers({});
    setCurrentIndex(0);
    setIsFinished(false);
    setOpenDetails({});
    setIsTransitioning(false);
    fetchQuestions();
  };

  const toggleDetails = (id: string) => {
    setOpenDetails((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  if (loading) {
    return (
      <div className="flex h-[100dvh] items-center justify-center bg-natural-bg text-natural-primary font-sans">
        Lade Fragen...
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-[100dvh] bg-natural-bg text-natural-text font-sans p-6 text-center">
        <p className="mb-4 text-natural-text font-medium">{error}</p>
        <button
          onClick={fetchQuestions}
          className="bg-natural-primary text-white px-6 py-2 rounded-full font-medium"
        >
          Vorne beginnen
        </button>
      </div>
    );
  }

  if (questions.length === 0) return null;

  const currentQ = questions[currentIndex] || questions[0];
  if (!currentQ && !isFinished) return null;

  const answeredCount = Object.keys(answers).length;
  const progress = isFinished ? 100 : Math.min(100, Math.max(0, (currentIndex / questions.length) * 100));

  return (
    <div className="flex flex-col h-[100dvh] bg-natural-bg font-sans max-w-md mx-auto relative overflow-hidden">
      
      <LayoutGroup>
        <AnimatePresence mode="wait">
          {!isFinished ? (
            <motion.div 
              key="question-screen"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
              className="flex flex-col h-full w-full"
            >
              {/* Very clean progress line at the very top */}
              <div className="w-full h-1.5 bg-natural-border shrink-0">
                <motion.div
                  className="h-full bg-natural-primary"
                  initial={{ width: 0 }}
                  animate={{ width: `${progress}%` }}
                  transition={{ duration: 0.3 }}
                />
              </div>
              
              <main className="flex-1 overflow-y-auto no-scrollbar w-full flex flex-col items-center px-6 pt-10 pb-32">
                
                {/* Central Focus Question Container */}
                <div className="w-full bg-white rounded-3xl p-6 shadow-sm border border-natural-border/30 flex flex-col items-center relative z-10 w-full mb-4">
                  
                  {/* Progress Text */}
                  <div className="w-full flex justify-center mb-6">
                    <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider bg-natural-bg px-3 py-1 rounded-full">
                      Frage {currentIndex + 1} von {questions.length}
                    </span>
                  </div>

                  {/* Centered Blob */}
                  <div className="w-full flex justify-center py-2 h-44 shrink-0 relative mb-6">
                    <motion.div
                      layoutId="main-score-blob"
                      className="w-40 h-40 relative z-10"
                      transition={{ type: "spring", stiffness: 45, damping: 20 }}
                    >
                      <ScoreBlob targetX={normX} targetY={normY} />
                    </motion.div>
                  </div>

                  <AnimatePresence mode="wait">
                    <motion.div
                      key={currentQ.id}
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -20 }}
                      transition={{ duration: 0.2 }}
                      className="w-full flex flex-col items-center text-center mt-2 relative z-20"
                    >
                      <h2 className="text-xl font-bold leading-snug mb-2 text-natural-text">
                        {currentQ.question}
                      </h2>
                    </motion.div>
                  </AnimatePresence>
                </div>

              </main>

              {/* Fixed Footer for Buttons */}
              <footer className="absolute bottom-0 left-0 right-0 p-6 pb-safe bg-gradient-to-t from-natural-bg via-natural-bg to-transparent pointer-events-none">
                <div className="grid grid-cols-3 gap-3 w-full max-w-md mx-auto pointer-events-auto">
                  <button
                    onClick={() => handleAnswer('yes')}
                    className="w-full bg-natural-primary text-white py-4 rounded-xl font-bold text-sm shadow-[0_8px_20px_rgba(45,106,79,0.2)] hover:-translate-y-0.5 transition-transform active:scale-[0.98] outline-none"
                  >
                    Ja
                  </button>
                   <button
                    onClick={() => handleAnswer('dont_know')}
                    className="w-full bg-white text-natural-text border border-natural-border py-4 rounded-xl font-bold text-sm shadow-sm hover:-translate-y-0.5 transition-transform active:scale-[0.98] outline-none"
                  >
                    Weiß nicht
                  </button>
                  <button
                    onClick={() => handleAnswer('no')}
                    className="w-full bg-white text-natural-text border border-natural-border py-4 rounded-xl font-bold text-sm shadow-sm hover:-translate-y-0.5 transition-transform active:scale-[0.98] outline-none"
                  >
                    Nein
                  </button>
                </div>
              </footer>

            </motion.div>
          ) : (
            <motion.div 
              key="result-screen"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="flex flex-col h-full w-full overflow-y-auto no-scrollbar pb-24"
            >
              
              {/* Clean Result Header */}
              <div className="px-6 py-8 flex justify-between items-center shrink-0">
                <h1 className="text-2xl font-bold text-natural-text">Auswertung</h1>
                <button
                  onClick={handleRestart}
                  className="flex items-center justify-center w-10 h-10 bg-white rounded-full text-natural-text shadow-sm border border-natural-border transition-transform active:scale-95"
                >
                  <RotateCcw className="w-5 h-5" />
                </button>
              </div>

              <div className="flex-1 flex flex-col items-center justify-start w-full px-6">
                
                {/* The 2D Coordinate Grid Container */}
                <div className="relative w-full max-w-[320px] shrink-0 mt-8 mb-4">
                  
                  {/* External Axis Labels */}
                  <div className="absolute -top-6 left-1/2 -translate-x-1/2 text-[9px] font-bold text-natural-primary uppercase tracking-[0.15em] whitespace-nowrap z-10 w-full text-center">
                    Bedürfnis <span className="opacity-50">↑</span>
                  </div>
                  <div className="absolute -bottom-[22px] right-2 text-[9px] font-bold text-natural-primary uppercase tracking-[0.15em] whitespace-nowrap z-10">
                    Nachhaltigkeit <span className="opacity-50">→</span>
                  </div>

                  {/* Actual Matrix Box */}
                  <div className="relative w-full aspect-square bg-white rounded-[32px] border border-natural-border shadow-[0_10px_30px_rgba(45,106,79,0.05)] overflow-hidden">
                  
                    {/* Highlight Zones with beautiful SVG overlays mapping directly to math formulation */}
                  <svg className="absolute inset-0 w-full h-full pointer-events-none" viewBox="0 0 200 200" preserveAspectRatio="none">
                    <defs>
                      <radialGradient id="potentialFill" cx="100" cy="100" r="86.67" gradientUnits="userSpaceOnUse">
                        <stop offset="0%" stopColor="#FDB917" stopOpacity="0.45"/>
                        <stop offset="100%" stopColor="#FDB917" stopOpacity="0.05"/>
                      </radialGradient>
                      <radialGradient id="suffizienzFill" cx="200" cy="0" r="200" gradientUnits="userSpaceOnUse">
                        <stop offset="0%" stopColor="#ABD037" stopOpacity="0.35"/>
                        <stop offset="100%" stopColor="#ABD037" stopOpacity="0"/>
                      </radialGradient>
                      <linearGradient id="arcStrokeGradient" x1="0" y1="0" x2="1" y2="1">
                        <stop offset="0%" stopColor="#2D6A4F" stopOpacity="0.7"/>
                        <stop offset="100%" stopColor="#2D6A4F" stopOpacity="0"/>
                      </linearGradient>
                    </defs>

                    {/* Bottom Half (-Y bounding) */}
                    <polygon points="0,100 186.67,100 193.33,200 0,200" fill="rgba(181, 9, 0, 0.04)" />

                    {/* Top Left (-X, +Y bounding) */}
                    <polygon points="0,6.67 100,13.33 100,100 0,100" fill="rgba(0, 0, 0, 0.02)" />

                    {/* Starkes Potential (inside arc from (0,13) to (13,0)) */}
                    <path d="M 100 100 L 100 13.33 A 86.67 86.67 0 0 1 186.67 100 Z" fill="url(#potentialFill)" />

                    {/* Suffizienz (outside the entire boundary spanning top and right) */}
                    <path d="M 0 0 L 200 0 L 200 200 L 193.33 200 L 186.67 100 A 86.67 86.67 0 0 0 100 13.33 L 0 6.67 Z" fill="url(#suffizienzFill)" />
                    
                    {/* The continuous bounding curve from x=-15 to x=15 marking Suffizienz limit */}
                    <path d="M 0 6.67 L 100 13.33 A 86.67 86.67 0 0 1 186.67 100 L 193.33 200" fill="none" stroke="url(#arcStrokeGradient)" strokeWidth="1.5" strokeDasharray="4 6" />

                    {/* Center origin visual marker (Zu wenige Infos: r=3 => ~20 units) */}
                    <circle cx="100" cy="100" r="20" fill="rgba(255,255,255,0.7)" stroke="rgba(0,0,0,0.1)" strokeWidth="1" />

                    {/* Axis lines - very subtle translucent green drawn ON TOP of the fills */}
                    <line x1="100" y1="0" x2="100" y2="200" stroke="rgba(45,106,79,0.15)" strokeWidth="1.5" />
                    <line x1="0" y1="100" x2="200" y2="100" stroke="rgba(45,106,79,0.15)" strokeWidth="1.5" />
                  </svg>

                  {/* Dynamic internal labels matching sketch placement strictly */}
                  <div className="absolute top-[8%] right-[8%] text-[8px] uppercase tracking-[0.15em] font-bold text-[#7ca019] text-right pointer-events-none">
                    Suffizienz
                  </div>
                  <div className="absolute top-[38%] right-[15%] text-[7.5px] uppercase tracking-[0.15em] font-bold text-[#b48208] text-right pointer-events-none opacity-80">
                    Starkes Potential
                  </div>
                  <div className="absolute bottom-[10%] right-[8%] text-[7.5px] uppercase tracking-[0.15em] font-bold text-gray-400 text-right pointer-events-none opacity-80">
                    Schwaches Potential
                  </div>

                  {/* BLOB CONTAINER mapping to target Coordinates */}
                  <div className="absolute inset-0 pointer-events-none">
                    <motion.div
                      layoutId="main-score-blob"
                      className="absolute w-20 h-20 -ml-10 -mt-10 z-20"
                      style={{
                        // Center is 50/50. 
                        left: `${50 + normX * 35}%`,
                        top: `${50 - normY * 35}%`
                      }}
                      transition={{ type: "spring", stiffness: 45, damping: 20 }}
                    >
                      <ScoreBlob targetX={normX} targetY={normY} />
                    </motion.div>
                  </div>
                  
                </div>
              </div>

                {/* Display evaluation text dynamically */}
                <AnimatePresence mode="wait">
                  {activeZone && (
                    <motion.div
                      key={activeZone.name}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      className="w-full bg-white p-5 rounded-[24px] border border-natural-border/60 shadow-sm mt-2 mb-8 text-center"
                    >
                      <h3 className="font-bold text-natural-primary text-xs uppercase tracking-wider mb-2">
                        {activeZone.name}
                      </h3>
                      <p className="text-[13px] text-gray-500 leading-relaxed">
                        {activeZone.sentence}
                      </p>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Interactive Question List  */}
                <div className="w-full flex flex-col gap-4">
                  {questions.map((q, idx) => {
                    const currentAnswer = answers[q.id];
                    const isDetailsVisible = openDetails[q.id];

                    return (
                      <div key={q.id} className="bg-white rounded-[24px] p-5 shadow-sm border border-natural-border/60 w-full flex flex-col relative">
                        <div className="flex items-start mb-4 pr-2 text-left">
                           <span className="w-6 h-6 rounded-full bg-natural-bg text-natural-primary text-xs font-bold flex items-center justify-center mr-3 shrink-0 mt-0.5">
                             {idx + 1}
                           </span>
                           <h3 className="font-bold text-natural-text text-[13px] leading-relaxed opacity-90">{q.short_label}</h3>
                        </div>

                        {/* Interactive Buttons per Question */}
                        <div className="grid grid-cols-3 gap-2 w-full">
                           <button
                             onClick={() => setAnswers(prev => ({ ...prev, [q.id]: 'yes' }))}
                             className={`py-2.5 rounded-xl text-xs font-bold transition-all ${
                               currentAnswer === 'yes' ? 'bg-natural-primary text-white shadow-md' : 'bg-natural-secondary text-gray-500 hover:bg-gray-200'
                             }`}
                           >
                             Ja
                           </button>
                           <button
                             onClick={() => setAnswers(prev => ({ ...prev, [q.id]: 'dont_know' }))}
                             className={`py-2.5 rounded-xl text-xs font-bold transition-all ${
                               currentAnswer === 'dont_know' ? 'bg-natural-primary text-white shadow-md' : 'bg-natural-secondary text-gray-500 hover:bg-gray-200'
                             }`}
                           >
                             Weiß nicht
                           </button>
                           <button
                             onClick={() => setAnswers(prev => ({ ...prev, [q.id]: 'no' }))}
                             className={`py-2.5 rounded-xl text-xs font-bold transition-all ${
                               currentAnswer === 'no' ? 'bg-natural-primary text-white shadow-md' : 'bg-natural-secondary text-gray-500 hover:bg-gray-200'
                             }`}
                           >
                             Nein
                           </button>
                        </div>

                         <button
                            onClick={() => toggleDetails(q.id)}
                            className="w-full flex items-center justify-between mt-5 text-[11px] font-bold uppercase tracking-wider text-gray-400 hover:text-natural-primary transition-colors focus:outline-none"
                          >
                            <span>Warum ist das wichtig?</span>
                            <motion.div animate={{ rotate: isDetailsVisible ? 180 : 0 }}>
                              <ChevronDown className="w-4 h-4" />
                            </motion.div>
                          </button>

                          <AnimatePresence>
                            {isDetailsVisible && (
                              <motion.div
                                initial={{ height: 0, opacity: 0 }}
                                animate={{ height: 'auto', opacity: 1 }}
                                exit={{ height: 0, opacity: 0 }}
                                className="overflow-hidden"
                              >
                                <div className="mt-4 pt-4 border-t border-natural-border/50">
                                  <p className="text-sm italic text-gray-500 leading-relaxed text-left">
                                    {q.why_it_matters}
                                  </p>
                                </div>
                              </motion.div>
                            )}
                          </AnimatePresence>
                      </div>
                    )
                  })}
                </div>

              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </LayoutGroup>
    </div>
  );
}
