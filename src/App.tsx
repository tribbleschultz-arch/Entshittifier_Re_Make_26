import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ChevronDown, RotateCcw, AlertTriangle } from 'lucide-react';
import { Question } from './types';

export default function App() {
  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [isFinished, setIsFinished] = useState(false);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchQuestions = async () => {
    setLoading(true);
    setError(null);
    try {
      // Füge Zeitstempel hinzu, um Caching zu umgehen (lädt bei jedem Start 'neu' wie gefordert)
      const res = await fetch(`/questions.json?t=${new Date().getTime()}`);
      if (!res.ok) throw new Error('Failed to fetch questions');
      const data = await res.json();
      setQuestions(data.questions);
    } catch (err: any) {
      setError(err.message || 'Ein Fehler ist aufgetreten');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchQuestions();
  }, []);

  // Setze den Details-State zurück, wenn die Frage wechselt
  useEffect(() => {
    setIsDetailsOpen(false);
  }, [currentIndex]);

  const handleAnswer = (weight: number) => {
    const currentQ = questions[currentIndex];
    
    setAnswers((prev) => ({
      ...prev,
      [currentQ.id]: weight,
    }));

    if (currentIndex < questions.length - 1) {
      setCurrentIndex((prev) => prev + 1);
    } else {
      setIsFinished(true);
    }
  };

  const handleRestart = () => {
    setAnswers({});
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
  const progress = ((currentIndex) / questions.length) * 100;

  // Render Result Page
  if (isFinished) {
    const score = questions.reduce((acc, q) => {
      const selectedWeight = answers[q.id] ?? 0;
      return acc + (selectedWeight * q.question_multiplier);
    }, 0);

    const maxScore = questions.reduce((acc, q) => {
      const maxWeight = Math.max(q.yes_weight, q.no_weight, q.dont_know_weight);
      return acc + (maxWeight * q.question_multiplier);
    }, 0);

    const percentage = maxScore > 0 ? (score / maxScore) * 100 : 0;

    let evaluationText = "";
    if (percentage >= 80) {
      evaluationText = "Hervorragend! Dieses Produkt zeichnet sich durch hohe Reparierbarkeit aus und unterstützt die Kreislaufwirtschaft optimal. Es verringert Abfall und schont wertvolle Ressourcen.";
    } else if (percentage >= 50) {
      evaluationText = "Befriedigend. Das Produkt lässt sich in Teilen reparieren, hat aber noch deutliches Verbesserungspotenzial. Einige Einschränkungen verhindern eine uneingeschränkte Langlebigkeit.";
    } else {
      evaluationText = "Mangelhaft. Dieses Produkt ist überwiegend nicht auf Langlebigkeit oder Reparierbarkeit ausgelegt. Bei einem Defekt droht es schnell zum Wegwerfprodukt zu werden.";
    }

    return (
      <div className="min-h-screen bg-natural-bg font-sans flex flex-col items-center py-6 md:py-12 px-4 relative">
        <div className="w-full max-w-3xl flex justify-end relative z-10 mb-8 md:mb-12">
          <button
            id="restart-button"
            onClick={handleRestart}
            className="flex items-center gap-2 px-4 py-2 bg-white rounded-full border border-natural-border text-xs font-bold uppercase tracking-wider text-natural-text hover:bg-stone-50 transition-colors shadow-sm"
          >
            <RotateCcw className="w-4 h-4" />
            Neustart
          </button>
        </div>

        <main className="w-full max-w-3xl flex-1 flex flex-col items-center justify-center -mt-8">
          
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="flex flex-col items-center w-full max-w-2xl text-center"
          >
            <div className="mb-12 flex flex-col items-center justify-center relative">
              <div className="text-6xl md:text-7xl font-serif font-bold text-natural-text">
                {Math.round(percentage)}%
              </div>
              <div className="text-[10px] md:text-xs uppercase font-bold opacity-40 text-natural-primary mt-2">Score</div>
              
              <div className="w-48 md:w-64 bg-natural-border rounded-full h-1 mt-6 overflow-hidden">
                <motion.div 
                  className="bg-natural-primary h-1 rounded-full" 
                  initial={{ width: 0 }}
                  animate={{ width: `${percentage}%` }}
                  transition={{ delay: 0.2, duration: 0.8, ease: "easeOut" }}
                ></motion.div>
              </div>
              <p className="text-natural-primary/80 font-medium text-sm mt-4">{Math.round(score)} / {maxScore} Punkten</p>
            </div>

            <div className="w-full space-y-6">
              <h2 className="font-serif text-3xl text-natural-text text-left">Auswertung</h2>
              <div className="bg-white p-8 rounded-[32px] border border-natural-border text-left md:text-lg leading-relaxed shadow-[0_10px_30px_rgba(90,90,64,0.05)] italic text-stone-600">
                <p>{evaluationText}</p>
              </div>
            </div>
          </motion.div>

        </main>
      </div>
    );
  }

  // Render Question Page
  return (
    <div className="flex flex-col h-[100dvh] bg-natural-bg font-sans p-4 md:p-8 flex items-center justify-center">
      <div className="w-full max-w-3xl h-full flex flex-col justify-between max-h-[800px]">
        <header className="flex justify-between items-center mb-8 shrink-0">
          <div className="text-xs md:text-sm uppercase tracking-widest font-semibold opacity-50 text-natural-text">
            Circular Scorecard
          </div>
          <div className="flex gap-1.5">
            {questions.map((_, i) => (
              <div
                key={i}
                className={`w-2 h-2 rounded-full transition-colors ${
                  i === currentIndex ? 'bg-natural-primary' : 'bg-natural-border'
                }`}
              />
            ))}
          </div>
        </header>

        <main className="flex-1 flex flex-col items-center justify-center text-center">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentQ.id}
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 1.02 }}
              transition={{ duration: 0.3 }}
              className="w-full flex flex-col items-center"
            >
              <div className="mb-4 px-4 py-1 bg-natural-border rounded-full text-[10px] font-bold uppercase tracking-wider text-natural-primary">
                Frage {currentIndex + 1} von {questions.length}
              </div>

              <h2 className="font-serif text-[28px] md:text-[32px] leading-snug lg:leading-snug mb-8 font-normal text-natural-text max-w-2xl px-2">
                {currentQ.question}
              </h2>

              <div id="why-it-matters-container" className="mt-2 w-full max-w-xl group relative">
                <button
                  onClick={() => setIsDetailsOpen(!isDetailsOpen)}
                  className="w-full flex items-center justify-center gap-2 cursor-pointer text-natural-primary font-medium text-sm md:text-base hover:opacity-80 transition-opacity"
                >
                  <motion.div
                    animate={{ rotate: isDetailsOpen ? 180 : 0 }}
                    transition={{ duration: 0.2 }}
                  >
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
                      className="overflow-hidden"
                    >
                      <div className="mt-4 p-6 bg-white border border-natural-border rounded-2xl text-sm md:text-base leading-relaxed text-natural-primary italic text-left shadow-[0_10px_30px_rgba(90,90,64,0.05)]">
                        {currentQ.why_it_matters}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </motion.div>
          </AnimatePresence>
        </main>

        <footer className="shrink-0 mt-8 md:mt-12 mb-4 w-full max-w-3xl">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6 w-full">
            <button
              onClick={() => handleAnswer(currentQ.yes_weight)}
              className="w-full bg-natural-primary text-white py-5 md:py-6 rounded-[32px] font-semibold text-base md:text-lg shadow-lg hover:-translate-y-0.5 hover:shadow-xl transition-all active:scale-[0.98] active:translate-y-0 focus:outline-none"
            >
              Ja
            </button>
            <button
              onClick={() => handleAnswer(currentQ.no_weight)}
              className="w-full bg-natural-secondary text-white py-5 md:py-6 rounded-[32px] font-semibold text-base md:text-lg shadow-lg hover:-translate-y-0.5 hover:shadow-xl transition-all active:scale-[0.98] active:translate-y-0 focus:outline-none"
            >
              Nein
            </button>
            <button
              onClick={() => handleAnswer(currentQ.dont_know_weight)}
              className="w-full bg-natural-neutral text-white py-5 md:py-6 rounded-[32px] font-semibold text-base md:text-lg shadow-lg hover:-translate-y-0.5 hover:shadow-xl transition-all active:scale-[0.98] active:translate-y-0 focus:outline-none"
            >
              Nicht sicher
            </button>
          </div>
        </footer>
      </div>
    </div>
  );
}

