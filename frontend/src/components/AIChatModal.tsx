import React, { useState } from 'react';
import {
  X,
  Sparkles,
  Send,
  Loader2,
  Bot,
  User,
} from 'lucide-react';
import { ChatMessage } from '../types';

interface AIChatModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const API_URL = 'http://127.0.0.1:8000';

export const AIChatModal: React.FC<AIChatModalProps> = ({
  isOpen,
  onClose,
}) => {

  const [messages, setMessages] =
    useState<ChatMessage[]>([
      {
        id: 'msg-1',
        sender: 'ai',
        text:
          'Greetings. I am LifeLoan AI, your dedicated loan intelligence & financial advisor. I can now use your LifeLoan profile and loan information to give you personalized answers.',
        timestamp:
          new Date().toLocaleTimeString([], {
            hour: '2-digit',
            minute: '2-digit',
          }),
      },
    ]);


  const [input, setInput] =
    useState('');


  const [loading, setLoading] =
    useState(false);


  if (!isOpen) {
    return null;
  }


  // ============================================================
  // QUICK QUESTIONS
  // ============================================================

  const quickQuestions = [
    'Why was my loan approved or rejected?',
    'What is my current loan risk?',
    'How can I improve my borrowing capacity?',
    'How are my current loans affecting me?',
  ];


  // ============================================================
  // GET USER CONTEXT
  // ============================================================

  const getLifeLoanContext = async () => {

  const userId =
    localStorage.getItem("user_id");

  // =====================================================
  // LATEST ML PREDICTION
  // =====================================================

  let latestPrediction = null;

  const storedPrediction =
    localStorage.getItem(
      "lifeloan_last_prediction"
    );

  if (storedPrediction) {

    try {

      latestPrediction =
        JSON.parse(
          storedPrediction
        );

    } catch (error) {

      console.warn(
        "Could not read saved prediction:",
        error
      );

    }

  }


  // =====================================================
  // APPLICATION DATA
  // =====================================================

  let latestApplication = null;

  const storedApplication =
    localStorage.getItem(
      "lifeloan_last_application"
    );

  if (storedApplication) {

    try {

      latestApplication =
        JSON.parse(
          storedApplication
        );

    } catch (error) {

      console.warn(
        "Could not read saved application:",
        error
      );

    }

  }


  // =====================================================
  // REAL LOANS FROM DATABASE
  // =====================================================

  let loans = [];

  if (userId) {

    try {

      const response =
        await fetch(
          `${API_URL}/loans?user_id=${userId}`
        );

      if (response.ok) {

        loans =
          await response.json();

      }

    } catch (error) {

      console.warn(
        "Could not load LifeLoan loans:",
        error
      );

    }

  }


  // =====================================================
  // RETURN COMPLETE LIFELOAN CONTEXT
  // =====================================================

  return {

    user_id:
      userId
        ? Number(userId)
        : null,

    latest_ml_prediction:
      latestPrediction,

    latest_application:
      latestApplication,

    active_loans:
      loans.map(
        (loan: any) => ({

          id:
            loan.id,

          title:
            loan.title,

          loan_type:
            loan.loan_type,

          original_amount:
            loan.amount,

          remaining_amount:
            loan.remaining_amount,

          monthly_emi:
            loan.emi,

          interest_rate:
            loan.interest_rate,

          tenure_months:
            loan.tenure_months,

          repayment_progress:
            loan.progress_percentage,

          status:
            loan.status,

          created_at:
            loan.created_at,

        })
      ),

  };

};

  // ============================================================
  // SEND MESSAGE
  // ============================================================

  const handleSend = async (
    textToSend?: string
  ) => {

    const query =
      textToSend ||
      input;


    if (
      !query.trim() ||
      loading
    ) {

      return;

    }


    // ----------------------------------------------------------
    // USER MESSAGE
    // ----------------------------------------------------------

    const userMsg: ChatMessage = {

      id:
        `usr-${Date.now()}`,

      sender:
        'user',

      text:
        query,

      timestamp:
        new Date().toLocaleTimeString(
          [],
          {
            hour: '2-digit',
            minute: '2-digit',
          }
        ),

    };


    setMessages(
      (prev) => [
        ...prev,
        userMsg,
      ]
    );


    setInput('');

    setLoading(true);


    try {

      // ========================================================
      // GET REAL LIFELOAN DATA
      // ========================================================

      const context =
        await getLifeLoanContext();


      console.log(
        'LifeLoan AI context:',
        context
      );


      // ========================================================
      // SEND TO FASTAPI
      // ========================================================

      const response =
        await fetch(
          `${API_URL}/ai-chat`,
          {
            method: 'POST',

            headers: {
              'Content-Type':
                'application/json',
            },

            body:
              JSON.stringify({
                prompt:
                  query,

                context:
                  context,
              }),
          }
        );


      // ========================================================
      // HANDLE BACKEND ERROR
      // ========================================================

      if (!response.ok) {

        let errorMessage =
          'Unable to contact LifeLoan AI.';


        try {

          const errorData =
            await response.json();


          if (
            errorData.detail
          ) {

            errorMessage =
              errorData.detail;

          }

        } catch {

          // Ignore JSON parsing error

        }


        throw new Error(
          errorMessage
        );

      }


      // ========================================================
      // READ GEMINI RESPONSE
      // ========================================================

      const data =
        await response.json();


      const aiReply =
        data.reply ||
        'I could not generate a response right now.';


      const aiMsg: ChatMessage = {

        id:
          `ai-${Date.now()}`,

        sender:
          'ai',

        text:
          aiReply,

        timestamp:
          new Date().toLocaleTimeString(
            [],
            {
              hour: '2-digit',
              minute: '2-digit',
            }
          ),

      };


      setMessages(
        (prev) => [
          ...prev,
          aiMsg,
        ]
      );


    } catch (error) {

      console.error(
        'LifeLoan AI error:',
        error
      );


      const errorText =
        error instanceof Error
          ? error.message
          : 'Unable to connect to LifeLoan AI.';


      setMessages(
        (prev) => [
          ...prev,

          {
            id:
              `ai-error-${Date.now()}`,

            sender:
              'ai',

            text:
              `Sorry, I couldn't connect to LifeLoan AI.\n\n${errorText}`,

            timestamp:
              new Date().toLocaleTimeString(
                [],
                {
                  hour: '2-digit',
                  minute: '2-digit',
                }
              ),
          },

        ]
      );


    } finally {

      setLoading(false);

    }

  };


  return (

    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#09100c]/85 backdrop-blur-md">

      <div className="relative flex flex-col h-[620px] w-full max-w-xl rounded-2xl glass-panel border border-[#3c4a42] shadow-2xl overflow-hidden">


        {/* =====================================================
            HEADER
            ===================================================== */}

        <div className="flex items-center justify-between border-b border-[#242c27] px-6 py-4 bg-[#161d19]">

          <div className="flex items-center space-x-2.5">

            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#10b981] text-[#003824]">

              <Sparkles className="h-4 w-4" />

            </div>


            <div>

              <h3 className="font-serif text-lg font-bold text-[#dde4dd]">

                LifeLoan AI Assistant

              </h3>


              <div className="flex items-center space-x-1 text-[10px] text-[#4edea3]">

                <span className="h-1.5 w-1.5 rounded-full bg-[#10b981] animate-ping" />

                <span>

                  {loading
                    ? 'Analyzing your LifeLoan profile...'
                    : 'Online • Personalized AI'}

                </span>

              </div>

            </div>

          </div>


          <button
            onClick={onClose}
            className="rounded-lg p-1 text-[#86948a] hover:bg-[#1a211d] hover:text-[#dde4dd]"
          >

            <X className="h-5 w-5" />

          </button>

        </div>


        {/* =====================================================
            MESSAGE LOG
            ===================================================== */}

        <div className="flex-1 overflow-y-auto p-6 space-y-4">

          {messages.map(
            (msg) => (

              <div
                key={msg.id}
                className={`flex items-start space-x-2.5 ${
                  msg.sender === 'user'
                    ? 'flex-row-reverse space-x-reverse'
                    : ''
                }`}
              >

                <div
                  className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-bold ${
                    msg.sender === 'user'
                      ? 'bg-[#1e1b4b] text-[#b9c8de]'
                      : 'bg-[#10b981]/20 text-[#4edea3]'
                  }`}
                >

                  {msg.sender === 'user' ? (

                    <User className="h-3.5 w-3.5" />

                  ) : (

                    <Bot className="h-3.5 w-3.5" />

                  )}

                </div>


                <div
                  className={`max-w-[80%] rounded-2xl p-3.5 text-xs leading-relaxed ${
                    msg.sender === 'user'
                      ? 'bg-[#10b981] text-[#003824] font-medium'
                      : 'bg-[#0e1511] text-[#dde4dd] border border-[#242c27]'
                  }`}
                >

                  <p className="whitespace-pre-wrap">

                    {msg.text}

                  </p>


                  <span
                    className={`block text-[9px] mt-1 text-right ${
                      msg.sender === 'user'
                        ? 'text-[#003824]/70'
                        : 'text-[#86948a]'
                    }`}
                  >

                    {msg.timestamp}

                  </span>

                </div>

              </div>

            )
          )}


          {loading && (

            <div className="flex items-center space-x-2 text-xs text-[#4edea3]">

              <Loader2 className="h-4 w-4 animate-spin" />

              <span>

                LifeLoan AI is checking your financial profile...

              </span>

            </div>

          )}

        </div>


        {/* =====================================================
            QUICK QUESTIONS
            ===================================================== */}

        <div className="px-6 py-2 border-t border-[#242c27] bg-[#0e1511]/50 overflow-x-auto flex space-x-2">

          {quickQuestions.map(
            (question, index) => (

              <button
                key={index}
                onClick={() =>
                  handleSend(question)
                }
                disabled={loading}
                className="shrink-0 rounded-full border border-[#2f3632] bg-[#161d19] px-3 py-1 text-[10px] text-[#bbcabf] hover:border-[#4edea3] hover:text-[#4edea3] transition-all disabled:opacity-40"
              >

                {question}

              </button>

            )
          )}

        </div>


        {/* =====================================================
            INPUT
            ===================================================== */}

        <div className="p-4 border-t border-[#242c27] bg-[#161d19]">

          <form
            onSubmit={(event) => {

              event.preventDefault();

              handleSend();

            }}

            className="flex items-center space-x-2"
          >

            <input
              type="text"
              value={input}
              onChange={(event) =>
                setInput(
                  event.target.value
                )
              }
              disabled={loading}
              placeholder="Ask LifeLoan AI about your loans or financial profile..."
              className="flex-1 rounded-full bg-[#0e1511] border border-[#242c27] px-4 py-2.5 text-xs text-[#dde4dd] focus:border-[#4edea3] focus:outline-none disabled:opacity-50"
            />


            <button
              type="submit"
              disabled={
                loading ||
                !input.trim()
              }
              className="flex h-9 w-9 items-center justify-center rounded-full bg-[#10b981] text-[#003824] hover:bg-[#4edea3] disabled:opacity-40 transition-all"
            >

              {loading ? (

                <Loader2 className="h-4 w-4 animate-spin" />

              ) : (

                <Send className="h-4 w-4" />

              )}

            </button>

          </form>

        </div>

      </div>

    </div>

  );

};