import { useEffect, useState, useMemo } from 'react';
import { motion, AnimatePresence, LayoutGroup } from 'motion/react';
import { ChevronDown, RotateCcw } from 'lucide-react';
import { Question, ScoreImpact } from './types';
import { ScoreBlob } from './components/ScoreBlob';

type AnswerOption = 'yes' | 'no' | 'dont_know';

export default function App() {
  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, AnswerOption>>({});
  const [maxBounds, setMaxBounds] = useState<ScoreImpact>({ x: 0.1, y: 0.1 });
  const [isFinished, setIsFinished] = useState(false);
  const [openDetails, setOpenDetails] = useState<Record<string, boolean>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchQuestions = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/questions.json?t=${new Date().getTime()}`);
      if (!res.ok) throw new Error('Failed to fetch questions');
      const data = await res.json();
      setQuestions(data.questions);

      // Compute theoretical maximum bounds
      let maxX = 0;
      let maxY = 0;
      data.questions.forEach((q: Question) => {
        maxX += Math.max(Math.abs(q.yes.x), Math.abs(q.no.x), Math.abs(q.dont_know.x));
        maxY += Math.max(Math.abs(q.yes.y), Math.abs(q.no.y), Math.abs(q.dont_know.y));
      });
      setMaxBounds({ x: maxX || 1, y: maxY || 1 });
      
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

  const handleAnswer = (option: AnswerOption) => {
    const currentQ = questions[currentIndex];
    setAnswers((prev) => ({ ...prev, [currentQ.id]: option }));

    if (currentIndex < questions.length - 1) {
      setTimeout(() => {
        setCurrentIndex((prev) => prev + 1);
        setOpenDetails({});
      }, 400); 
    } else {
      setTimeout(() => {
        setIsFinished(true);
      }, 400);
    }
  };

  const handleRestart = () => {
    setAnswers({});
    setCurrentIndex(0);
    setIsFinished(false);
    setOpenDetails({});
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

  const currentQ = questions[currentIndex];
  const answeredCount = Object.keys(answers).length;
  const progress = isFinished ? 100 : Math.min(100, Math.max(0, (currentIndex / questions.length) * 100));

  // Normalized scores bounded to [-1, 1]
  const normX = Math.max(-1, Math.min(1, currentScore.x / maxBounds.x));
  const normY = Math.max(-1, Math.min(1, currentScore.y / maxBounds.y));

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
                
                {/* The 2D Coordinate Grid */}
                <div className="relative w-full max-w-sm aspect-square bg-white rounded-[32px] border border-natural-border shadow-[0_10px_30px_rgba(45,106,79,0.05)] mb-8 overflow-hidden shrink-0 mt-4">
                  
                  {/* Axis lines */}
                  <div className="absolute left-1/2 top-0 bottom-0 w-px bg-natural-border -translate-x-1/2"></div>
                  <div className="absolute top-1/2 left-0 right-0 h-px bg-natural-border -translate-y-1/2"></div>

                  {/* Draw the Sufficiency Arc in +X, +Y quadrant (Top Right) */}
                  <div className="absolute w-[50%] h-[50%] right-0 top-0 overflow-hidden pointer-events-none">
                     <div className="absolute bottom-0 left-0 w-[200%] h-[200%] rounded-full border-2 border-dashed border-natural-primary/30 origin-bottom-left pointer-events-none"></div>
                  </div>

                  {/* Labels Output */}
                  <div className="absolute -top-6 left-1/2 -translate-x-1/2 text-[9px] uppercase tracking-widest font-bold text-gray-400 whitespace-nowrap">
                    Grundbedürfnis
                  </div>
                  <div className="absolute -bottom-6 left-1/2 -translate-x-1/2 text-[9px] uppercase tracking-widest font-bold text-gray-400 whitespace-nowrap">
                    Exzess / Überfluss
                  </div>
                  <div className="absolute top-1/2 -left-6 -translate-y-1/2 -rotate-90 text-[9px] uppercase tracking-widest font-bold text-gray-400 whitespace-nowrap origin-center">
                    Geringe Suffizienz
                  </div>
                  <div className="absolute top-1/2 -right-6 -translate-y-1/2 rotate-90 text-[9px] uppercase tracking-widest font-bold text-gray-400 whitespace-nowrap origin-center">
                    Nachhaltig
                  </div>

                  {/* Dynamic internal labels for Top Right */}
                  <div className="absolute top-[18%] right-[15%] text-[8px] uppercase tracking-widest font-bold text-natural-primary/50 text-center pointer-events-none">
                    Suffizient
                  </div>
                  <div className="absolute top-[40%] right-[4%] text-[8px] uppercase tracking-widest font-bold text-orange-400/50 text-center pointer-events-none">
                    Potential
                  </div>

                  {/* BLOB CONTAINER mapping to target Coordinates */}
                  <div className="absolute inset-0 overflow-hidden rounded-[32px] pointer-events-none">
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
                           <h3 className="font-bold text-natural-text text-[13px] leading-relaxed opacity-90">{q.question}</h3>
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
