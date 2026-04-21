import { useEffect, useState } from 'react';
import { motion, AnimatePresence, LayoutGroup } from 'motion/react';
import { ChevronDown, RotateCcw, AlertTriangle } from 'lucide-react';
import { Question, ScoreImpact } from './types';
import { ScoreBlob } from './components/ScoreBlob';

export default function App() {
  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [currentScore, setCurrentScore] = useState<ScoreImpact>({ x: 0, y: 0 });
  const [maxBounds, setMaxBounds] = useState<ScoreImpact>({ x: 0.1, y: 0.1 });
  const [isFinished, setIsFinished] = useState(false);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
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

  useEffect(() => {
    setIsDetailsOpen(false);
  }, [currentIndex]);

  const handleAnswer = (impact: ScoreImpact) => {
    setCurrentScore((prev) => ({
      x: prev.x + impact.x,
      y: prev.y + impact.y,
    }));

    if (currentIndex < questions.length - 1) {
      setCurrentIndex((prev) => prev + 1);
    } else {
      setIsFinished(true);
    }
  };

  const handleRestart = () => {
    setCurrentScore({ x: 0, y: 0 });
    setCurrentIndex(0);
    setIsFinished(false);
    fetchQuestions();
  };

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-natural-bg text-natural-primary font-sans">
        Lade Fragen...
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-screen bg-natural-bg text-natural-secondary font-sans p-6 text-center">
        <AlertTriangle className="w-12 h-12 mb-4 text-natural-secondary" />
        <p className="mb-4 text-natural-text">Die Fragen konnten nicht geladen werden.</p>
        <button
          onClick={fetchQuestions}
          className="bg-natural-primary text-white border border-natural-border px-6 py-2 rounded-full font-medium"
        >
          Vorne beginnen
        </button>
      </div>
    );
  }

  if (questions.length === 0) return null;

  const currentQ = questions[currentIndex];
  const progress = (currentIndex / questions.length) * 100;

  // Normalized scores bounded to [-1, 1]
  const normX = Math.max(-1, Math.min(1, currentScore.x / maxBounds.x));
  const normY = Math.max(-1, Math.min(1, currentScore.y / maxBounds.y));

  return (
    <div className="flex flex-col h-[100dvh] bg-natural-bg font-sans max-w-2xl mx-auto md:shadow-xl relative overflow-hidden">
      <LayoutGroup>
        <AnimatePresence mode="wait">
          {!isFinished ? (
            <motion.div 
              key="question-screen"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
              className="flex flex-col h-full w-full"
            >
              <header className="px-6 py-5 bg-natural-bg md:bg-white border-b border-natural-border shrink-0">
                <div className="flex justify-between items-center mb-4">
                  <span className="text-xs font-semibold tracking-wider text-natural-primary uppercase">
                    Frage {currentIndex + 1} von {questions.length}
                  </span>
                  <span className="text-xs font-medium text-natural-text opacity-50">
                    {Math.round(progress)}%
                  </span>
                </div>
                <div className="w-full bg-natural-border rounded-full h-1.5 overflow-hidden">
                  <motion.div
                    className="bg-natural-primary h-1.5 rounded-full"
                    initial={{ width: 0 }}
                    animate={{ width: `${progress}%` }}
                    transition={{ duration: 0.3 }}
                  />
                </div>
              </header>

              <main className="flex-1 overflow-y-auto w-full flex flex-col items-center p-6 md:p-8">
                
                {/* BLOB CONTAINER on Question Screen */}
                <div className="w-full flex justify-center py-4 md:py-8 h-48 md:h-64 shrink-0 relative">
                  <motion.div
                    layoutId="main-score-blob"
                    className="w-48 h-48 md:w-64 md:h-64 relative z-10"
                    transition={{ type: "spring", stiffness: 45, damping: 20 }}
                  >
                    <ScoreBlob targetX={normX} targetY={normY} />
                  </motion.div>
                </div>

                <AnimatePresence mode="wait">
                  <motion.div
                    key={currentQ.id}
                    initial={{ opacity: 0, scale: 0.98 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 1.02 }}
                    transition={{ duration: 0.3 }}
                    className="flex-1 w-full flex flex-col items-center text-center"
                  >
                    <h2 className="font-serif text-[24px] md:text-[32px] leading-snug lg:leading-snug mb-8 font-normal text-natural-text max-w-xl px-2">
                      {currentQ.question}
                    </h2>

                    <div className="w-full max-w-xl group relative">
                      <button
                        onClick={() => setIsDetailsOpen(!isDetailsOpen)}
                        className="w-full flex items-center justify-center gap-2 cursor-pointer text-natural-primary font-medium text-sm md:text-base hover:opacity-80 transition-opacity"
                      >
                        <motion.div animate={{ rotate: isDetailsOpen ? 180 : 0 }} transition={{ duration: 0.2 }}>
                          <ChevronDown className="w-4 h-4 md:w-5 md:h-5 text-natural-primary" />
                        </motion.div>
                        Warum ist das wichtig?
                      </button>

                      <AnimatePresence>
                        {isDetailsOpen && (
                          <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: 'auto', opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            transition={{ duration: 0.2 }}
                            className="overflow-hidden mt-4"
                          >
                            <div className="p-6 bg-white md:bg-natural-bg border border-natural-border rounded-2xl text-sm md:text-base leading-relaxed text-natural-primary italic text-left shadow-[0_4px_15px_rgba(90,90,64,0.05)]">
                              {currentQ.why_it_matters}
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  </motion.div>
                </AnimatePresence>
              </main>

              <footer className="shrink-0 p-4 md:p-6 bg-natural-bg md:bg-white border-t border-natural-border pb-safe">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 w-full">
                  <button
                    onClick={() => handleAnswer(currentQ.yes)}
                    className="w-full bg-natural-primary text-white py-5 rounded-[24px] font-semibold text-lg hover:-translate-y-0.5 hover:shadow-lg transition-transform active:scale-[0.98] outline-none"
                  >
                    Ja
                  </button>
                  <button
                    onClick={() => handleAnswer(currentQ.no)}
                    className="w-full bg-natural-secondary text-white py-5 rounded-[24px] font-semibold text-lg hover:-translate-y-0.5 hover:shadow-lg transition-transform active:scale-[0.98] outline-none"
                  >
                    Nein
                  </button>
                  <button
                    onClick={() => handleAnswer(currentQ.dont_know)}
                    className="w-full bg-natural-neutral text-white py-5 rounded-[24px] font-semibold text-lg hover:-translate-y-0.5 hover:shadow-lg transition-transform active:scale-[0.98] outline-none"
                  >
                    Nicht sicher
                  </button>
                </div>
              </footer>
            </motion.div>
          ) : (
            <motion.div 
              key="result-screen"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="flex flex-col h-full w-full py-8 px-6 overflow-y-auto"
            >
              <div className="w-full flex justify-between items-center mb-10 shrink-0">
                <h1 className="font-serif text-3xl text-natural-text text-left">Dein Profil</h1>
                <button
                  onClick={handleRestart}
                  className="flex items-center gap-2 px-4 py-2 bg-white rounded-full border border-natural-border text-xs font-bold uppercase tracking-wider text-natural-text hover:bg-stone-50 transition-colors shadow-sm"
                >
                  <RotateCcw className="w-4 h-4" />
                  Neustart
                </button>
              </div>

              <div className="flex-1 flex flex-col items-center justify-start w-full relative">
                
                {/* The 2D Coordinate Grid */}
                <div className="relative w-full max-w-sm aspect-square bg-white rounded-3xl border border-natural-border shadow-[0_10px_30px_rgba(90,90,64,0.05)] mb-10 mt-8">
                  
                  {/* Axis lines */}
                  <div className="absolute left-1/2 top-0 bottom-0 w-px bg-natural-border -translate-x-1/2"></div>
                  <div className="absolute top-1/2 left-0 right-0 h-px bg-natural-border -translate-y-1/2"></div>

                  {/* Labels Output */}
                  <div className="absolute -top-6 left-1/2 -translate-x-1/2 text-[10px] uppercase tracking-widest font-bold text-natural-primary/50 whitespace-nowrap">
                    Grundbedürfnis
                  </div>
                  <div className="absolute -bottom-6 left-1/2 -translate-x-1/2 text-[10px] uppercase tracking-widest font-bold text-natural-primary/50 whitespace-nowrap">
                    Exzess / Überfluss
                  </div>
                  <div className="absolute top-1/2 -left-6 -translate-y-1/2 -rotate-90 text-[10px] uppercase tracking-widest font-bold text-natural-primary/50 whitespace-nowrap origin-center">
                    Geringe Suffizienz
                  </div>
                  <div className="absolute top-1/2 -right-6 -translate-y-1/2 rotate-90 text-[10px] uppercase tracking-widest font-bold text-natural-primary/50 whitespace-nowrap origin-center">
                    Hohe Suffizienz
                  </div>

                  {/* BLOB CONTAINER mapping to target Coordinates */}
                  <div className="absolute inset-0 overflow-hidden rounded-3xl pointer-events-none">
                    <motion.div
                      layoutId="main-score-blob"
                      className="absolute w-24 h-24 -ml-12 -mt-12 z-20"
                      style={{
                        // Center is 50/50. Safe bounds 15% to 85% to not overflow container wildly 
                        left: `${50 + normX * 35}%`,
                        top: `${50 - normY * 35}%`
                      }}
                      transition={{ type: "spring", stiffness: 45, damping: 20 }}
                    >
                      <ScoreBlob targetX={normX} targetY={normY} />
                    </motion.div>
                  </div>
                  
                </div>

                {/* Optional Result Explanation */}
                <div className="w-full max-w-sm bg-white p-6 rounded-[24px] border border-natural-border text-center leading-relaxed text-stone-600 text-sm shadow-sm mt-4">
                  {normX >= 0 && normY >= 0 && (
                    <p>Dein Produkt bedient primär <b>Grundbedürfnisse</b> bei gleichzeitig <b>hoher Suffizienz</b>. Ein exzellentes Beispiel für langlebigen, nachhaltigen Konsum!</p>
                  )}
                  {normX < 0 && normY >= 0 && (
                    <p>Es geht um ein echtes <b>Grundbedürfnis</b>, doch die Umsetzung weist <b>wenig Suffizienz</b> auf. Hier gibt es starkes Potenzial für nachhaltigere oder besser reparierbare Alternativen.</p>
                  )}
                  {normX < 0 && normY < 0 && (
                    <p><b>Kritisch:</b> Eine geringe Suffizienz gepaart mit einem Produkt, das eher im <b>Luxus- oder Exzess-Bereich</b> zu verorten ist. Überlege, ob dieser Konsum wirklich essenziell ist.</p>
                  )}
                  {normX >= 0 && normY < 0 && (
                    <p><b>Nachhaltiger Luxus:</b> Das Produkt ist vielleicht nicht essenziell, punktet dafür aber mit einem <b>suffizienten</b>, reparaturfreundlichen Design.</p>
                  )}
                </div>

              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </LayoutGroup>
    </div>
  );
}

