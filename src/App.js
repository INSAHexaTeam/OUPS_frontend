import { BrowserRouter, Routes, Route } from "react-router-dom";
import {
  ThemeProvider,
  StyledEngineProvider,
  createTheme,
} from "@mui/material/styles";

import Accueil from "./Pages/Accueil.tsx";
import Carte from "./Pages/Carte.tsx";


const theme = createTheme();
function App() {
  return (
    <StyledEngineProvider injectFirst>
      <ThemeProvider theme={theme}>
        <BrowserRouter>
          <Routes>
            <Route exact path="/" element={<Accueil />} />
            <Route exact path="/carte" element={<Carte />} />
            <Route exact path="/valider-carte" element={<Accueil />} />
            <Route exact path="/valider-demande" element={<Accueil />} />
          </Routes>
        </BrowserRouter>
      </ThemeProvider>
    </StyledEngineProvider>
  );
}

export default App;
