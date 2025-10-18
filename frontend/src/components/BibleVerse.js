import React, { useState, useEffect } from 'react';
import { StyledComponents } from '../theme/StyledComponents';

const BibleVerse = () => {
  const [verse, setVerse] = useState(null);
  const [loading, setLoading] = useState(true);

  // Collection of inspiring Bible verses for church financial stewardship
  const bibleVerses = [
    {
      text: "Each of you should give what you have decided in your heart to give, not reluctantly or under compulsion, for God loves a cheerful giver.",
      reference: "2 Corinthians 9:7",
      theme: "stewardship"
    },
    {
      text: "Whoever is faithful in very little is also faithful in much, and whoever is dishonest in very little is also dishonest in much.",
      reference: "Luke 16:10",
      theme: "faithfulness"
    },
    {
      text: "But my God shall supply all your need according to his riches in glory by Christ Jesus.",
      reference: "Philippians 4:19",
      theme: "provision"
    },
    {
      text: "Honor the Lord with your wealth, with the firstfruits of all your crops; then your barns will be filled to overflowing, and your vats will brim over with new wine.",
      reference: "Proverbs 3:9-10",
      theme: "honor"
    },
    {
      text: "Command them to do good, to be rich in good deeds, and to be generous and willing to share.",
      reference: "1 Timothy 6:18",
      theme: "generosity"
    },
    {
      text: "For where your treasure is, there your heart will be also.",
      reference: "Matthew 6:21",
      theme: "treasure"
    },
    {
      text: "Give, and it will be given to you. A good measure, pressed down, shaken together and running over, will be poured into your lap.",
      reference: "Luke 6:38",
      theme: "giving"
    },
    {
      text: "The plans of the diligent lead to profit as surely as haste leads to poverty.",
      reference: "Proverbs 21:5",
      theme: "diligence"
    },
    {
      text: "Commit to the Lord whatever you do, and he will establish your plans.",
      reference: "Proverbs 16:3",
      theme: "commitment"
    },
    {
      text: "Trust in the Lord with all your heart and lean not on your own understanding; in all your ways submit to him, and he will make your paths straight.",
      reference: "Proverbs 3:5-6",
      theme: "trust"
    }
  ];

  useEffect(() => {
    // Get verse of the day based on current date
    const today = new Date();
    const dayOfYear = Math.floor((today - new Date(today.getFullYear(), 0, 0)) / (1000 * 60 * 60 * 24));
    const verseIndex = dayOfYear % bibleVerses.length;
    
    // Simulate a small loading time for smooth experience
    setTimeout(() => {
      setVerse(bibleVerses[verseIndex]);
      setLoading(false);
    }, 500);
  }, []);

  if (loading) {
    return (
      <div style={{
        ...StyledComponents.Card,
        textAlign: 'center',
        padding: '2rem',
        background: 'linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%)'
      }}>
        <div style={{ color: '#6c757d', fontSize: '1rem' }}>
          Loading daily verse...
        </div>
      </div>
    );
  }

  return (
    <div style={{
      ...StyledComponents.Card,
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      color: 'white',
      textAlign: 'center',
      position: 'relative',
      overflow: 'hidden'
    }}>
      {/* Decorative background pattern */}
      <div style={{
        position: 'absolute',
        top: '-50%',
        right: '-50%',
        width: '200%',
        height: '200%',
        background: 'radial-gradient(circle, rgba(255,255,255,0.1) 0%, transparent 70%)',
        pointerEvents: 'none'
      }}></div>
      
      <div style={{ position: 'relative', zIndex: 1 }}>
        {/* Header */}
        <div style={{ 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'center',
          gap: '0.75rem',
          marginBottom: '1.5rem'
        }}>
          <span style={{ fontSize: '1.5rem' }}>📖</span>
          <h3 style={{ 
            margin: 0, 
            fontSize: '1.25rem',
            fontWeight: '500',
            opacity: 0.9
          }}>
            Daily Promise
          </h3>
        </div>

        {/* Bible Verse */}
        <blockquote style={{
          margin: '0 0 1.5rem 0',
          fontSize: '1.125rem',
          lineHeight: '1.6',
          fontStyle: 'italic',
          padding: '0 1rem',
          position: 'relative'
        }}>
          <span style={{
            fontSize: '2rem',
            position: 'absolute',
            left: '-0.5rem',
            top: '-0.5rem',
            opacity: 0.3
          }}>"</span>
          {verse?.text}
          <span style={{
            fontSize: '2rem',
            position: 'absolute',
            right: '-0.5rem',
            bottom: '-1rem',
            opacity: 0.3
          }}>"</span>
        </blockquote>

        {/* Reference */}
        <cite style={{
          fontSize: '1rem',
          fontWeight: '600',
          opacity: 0.9,
          fontStyle: 'normal'
        }}>
          — {verse?.reference}
        </cite>

        {/* Date */}
        <div style={{
          marginTop: '1.5rem',
          paddingTop: '1rem',
          borderTop: '1px solid rgba(255,255,255,0.2)',
          fontSize: '0.875rem',
          opacity: 0.8
        }}>
          {new Date().toLocaleDateString('en-US', { 
            weekday: 'long', 
            year: 'numeric', 
            month: 'long', 
            day: 'numeric' 
          })}
        </div>
      </div>
    </div>
  );
};

export default BibleVerse;