import React from 'react';

/**
 * DevelopmentStatus component
 * Displays development/beta status message on landing page
 */
const DevelopmentStatus: React.FC = () => {
  return (
    <section className="relative py-20 px-4">
      <div className="container mx-auto max-w-4xl text-center">
        <div className="bg-gradient-to-r from-purple-900/30 to-blue-900/30 rounded-2xl p-8 backdrop-blur-sm border border-purple-500/20">
          <h2 className="text-2xl md:text-3xl font-bold text-white mb-4">
            🚀 Currently in Development
          </h2>
          <p className="text-gray-300 text-lg">
            We're working hard to bring you the best quiz gaming experience. 
            Stay tuned for updates!
          </p>
        </div>
      </div>
    </section>
  );
};

export default DevelopmentStatus;
