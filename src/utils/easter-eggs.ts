export const initEasterEggs = () => {
    console.log("%c👋 Hey there, developer!", "color: #FF6B35; font-size: 20px; font-weight: bold;");
    console.log("%c🎵 I see you're inspecting my code. Want to work together?", "color: #0066CC; font-size: 14px;");
    console.log("%cCheck out my projects: https://github.com/bobrossrtx", "color: #888; font-size: 12px;");
    console.log("%c🥚 Easter egg: Try typing 'rave()' in the console...", "color: #FF6B35; font-size: 12px; font-style: italic;");

    (window as any).rave = () => {
        console.log("Rave mode activated! (To be implemented)");
        document.body.classList.toggle('rave-mode');
    };
};
