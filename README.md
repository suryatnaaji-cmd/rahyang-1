<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Rahyang Images Generator V4.6</title>
    <script src="https://cdn.tailwindcss.com"></script>
    <style>
      @keyframes pulse-slow {
        0%, 100% { opacity: 0.5; }
        50% { opacity: 1; }
      }
      .animate-pulse-slow {
        animation: pulse-slow 4s cubic-bezier(0.4, 0, 0.6, 1) infinite;
      }
      
      /* Custom Scrollbar for nicer UI */
      ::-webkit-scrollbar {
        width: 8px;
        height: 8px;
      }
      ::-webkit-scrollbar-track {
        background: #f1f1f1; 
      }
      ::-webkit-scrollbar-thumb {
        background: #d1d5db; 
        border-radius: 4px;
      }
      ::-webkit-scrollbar-thumb:hover {
        background: #9ca3af; 
      }

      /* Image Overlay Transition */
      .image-overlay {
          opacity: 0;
          transition: opacity 0.3s ease-in-out;
      }
      .image-container:hover .image-overlay {
          opacity: 1;
      }
    </style>
  <script type="importmap">
{
  "imports": {
    "react-dom/": "https://aistudiocdn.com/react-dom@^19.2.0/",
    "lucide-react": "https://aistudiocdn.com/lucide-react@^0.555.0",
    "@google/genai": "https://aistudiocdn.com/@google/genai@^1.30.0",
    "react/": "https://aistudiocdn.com/react@^19.2.0/",
    "react": "https://aistudiocdn.com/react@^19.2.0"
  }
}
</script>
</head>
  <body class="bg-gray-50 text-gray-900 font-sans">
    <div id="root"></div>
  </body>
</html>
