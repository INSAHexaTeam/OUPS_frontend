import React, { useState, useEffect, useRef } from 'react';
import Carte from './Carte.tsx';
import { Intersection, Point } from '../Utils/points';
import { Box, Button } from "@mui/material";
import toast, { Toaster } from "react-hot-toast";
import MailIcon from '@mui/icons-material/Mail';
import MapIcon from '@mui/icons-material/Map';
import {styled} from "@mui/material/styles";

const VisuallyHiddenInput = styled('input')({
    clip: 'rect(0 0 0 0)',
    clipPath: 'inset(50%)',
    height: 1,
    overflow: 'hidden',
    position: 'absolute',
    bottom: 0,
    left: 0,
    whiteSpace: 'nowrap',
    width: 1,
});

export default function TourneeVue() {




    return (
        <Box sx={{ display: "flex", flexDirection: "row", width: '100%', height: '100%', justifyContent: "center" }}>
            <Toaster />
            
        </Box>
    );
}