import { BrowserRouter, Routes, Route } from "react-router-dom";
// import "./style/App.css";
import {
  ThemeProvider,
  StyledEngineProvider,
  createTheme,
} from "@mui/material/styles";

import Accueil from "./Pages/Accueil.tsx";
import Carte from "./Pages/Carte.tsx";
import AffichageXml from "./Pages/XML.tsx";


const theme = createTheme();
function App() {
  return (
    <StyledEngineProvider injectFirst>
      <ThemeProvider theme={theme}>
        <BrowserRouter>
          <Routes>
            <Route exact path="/accueil" element={<Accueil />} />
            <Route exact path="/carte" element={<Carte />} />
            <Route exact path="/calculer-itineraire" element={<AffichageXml />} />
          </Routes>
        </BrowserRouter>
      </ThemeProvider>
    </StyledEngineProvider>
  );
}

export default App;
