import React, { useState } from 'react';
import { Database, ExternalLink } from 'lucide-react';

interface TrainingHubProps {
  copiedSection: string | null;
}

export const TrainingHub: React.FC<TrainingHubProps> = ({ copiedSection }) => {
  const datasets = [
    {
      id: 'squad',
      title: 'Stanford Question Answering Dataset (SQuAD 2.0)',
      category: 'Grounded Reading Comprehension & RAG',
      kaggleUrl: 'https://www.kaggle.com/datasets/stanfordu/stanford-question-answering-dataset',
      description: 'The golden standard for extractive and grounded reading comprehension. 100k+ question-context-answer triples with unanswerable questions to train models to avoid hallucinations.',
      stats: '100,000+ QA pairs • Wikipedia Articles'
    },
    {
      id: 'news-summary',
      title: 'News Summary (Inshorts Dataset)',
      category: 'Document Summarization & Briefings',
      kaggleUrl: 'https://www.kaggle.com/datasets/sunnysai12345/news-summary',
      description: '45,000+ paired news articles with concise, high-density human editorial summaries. Ideal for training the Orion Briefing and Study Guide generator.',
      stats: '45,000+ Documents • High-Density Summaries'
    },
    {
      id: 'cnn-dailymail',
      title: 'CNN/DailyMail News Text Summarization',
      category: 'Long-Form Synthesis & Abstractive Summary',
      kaggleUrl: 'https://www.kaggle.com/datasets/gowrishankarp/newspaper-text-summarization-cnn-dailymail',
      description: '300,000+ complex multi-paragraph articles paired with multi-sentence bulleted takeaways. Perfect for large-context study guide training.',
      stats: '300,000+ Pairs • Multi-Bullet Synthesis'
    },
    {
      id: 'dialogsum',
      title: 'DialogSum / SAMSum Dialogue Corpus',
      category: 'Dual-Host Podcast & Conversational Reasoning',
      kaggleUrl: 'https://www.kaggle.com/datasets',
      hfIdentifier: 'knkarthick/dialogsum',
      description: '13,000+ multi-turn dialogues with conversational summaries and speaker turn structures. Used directly to train the Orion Audio Deep Dive (Alex & Sam) podcast generator.',
      stats: '13,000+ Dialogues • Multi-Speaker Turns'
    }
  ];

  return (
    <div className="flex-1 overflow-y-auto p-6 md:p-10 space-y-10 max-w-6xl mx-auto">
      {/* Hero Section */}
      <div className="space-y-3">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-surface-hover border border-surface-border text-xs font-mono text-foregroundSubtle">
          <Database className="w-3.5 h-3.5" />
          <span>Kaggle Dataset Hub & Custom Model Training</span>
        </div>
        <h1 className="editorial-title text-3xl md:text-4xl font-bold text-foreground tracking-tight">
          Train Your Own Private Orion LLM
        </h1>
        <p className="text-sm md:text-base text-foregroundSubtle max-w-3xl leading-relaxed">
          Fine-tune a customized, low-latency open model (LLaMA 3.2, Qwen 2.5, or Mistral) on curated Kaggle datasets for grounded RAG and dual-speaker podcast generation without cloud API fees.
        </p>
      </div>

      {/* Kaggle Datasets Grid */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-semibold text-foregroundSubtle flex items-center gap-2 font-mono uppercase tracking-wider">
            Curated Datasets for Orion
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {datasets.map((ds) => (
            <div
              key={ds.id}
              className="p-5 rounded-2xl bg-surface-card border border-surface-border hover:border-accent/40 transition-all flex flex-col justify-between group"
            >
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-surface-base border border-surface-border text-accentSubtle">
                    {ds.category}
                  </span>
                  <a
                    href={ds.kaggleUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs text-foregroundSubtle hover:text-accent text-accentSubtle flex items-center gap-1 transition-colors"
                  >
                    <span>Kaggle</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </div>

                <h3 className="text-sm font-semibold text-foreground group-hover:text-accent transition-colors mb-2">
                  {ds.title}
                </h3>

                <p className="text-xs text-foregroundSubtle leading-relaxed mb-4">
                  {ds.description}
                </p>

                <div className="pt-3 border-t border-surface-border/60 flex items-center justify-between text-[11px] text-foregroundMuted font-mono">
                  <span>{ds.stats}</span>
                  {ds.hfIdentifier && (
                    <span className="text-foregroundMuted">HF: {ds.hfIdentifier}</span>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};