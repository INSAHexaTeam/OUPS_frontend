import * as React from "react";
import { styled } from "@mui/material/styles";
import "../Styles/drawer.css";
import List from "@mui/material/List";
import ListItem from "@mui/material/ListItem";
import ListItemButton from "@mui/material/ListItemButton";
import ListItemIcon from "@mui/material/ListItemIcon";
import ListItemText from "@mui/material/ListItemText";
import AccountBoxIcon from "@mui/icons-material/AccountBox";
import DashboardIcon from "@mui/icons-material/Dashboard";
import ImportContactsIcon from "@mui/icons-material/ImportContacts";
import SupervisorAccountIcon from "@mui/icons-material/SupervisorAccount";
import CoPresentRoundedIcon from "@mui/icons-material/CoPresentRounded";
import Tooltip from "@mui/material/Tooltip";
import { useNavigate } from "react-router-dom";
import MuiDrawer from "@mui/material/Drawer";
import { Toaster } from "react-hot-toast";
import {IconButton} from "@mui/material";
import ChevronLeftIcon from "@mui/icons-material/ChevronLeft";
import ChevronRightIcon from "@mui/icons-material/ChevronRight";


export const drawerWidth = 250;
export const drawerCloseWidth = 73;
export const DrawerHeader = styled("div")(({ theme }) => ({
    display: "flex",
    alignItems: "center",
    justifyContent: "flex-end",
    padding: theme.spacing(0, 1),
    // necessary for content to be below app bar
    ...theme.mixins.toolbar,
}));

export const Drawer = styled(MuiDrawer, {
    shouldForwardProp: (prop) => prop !== "open",
})(({ theme, open }) => ({
    width: 240,
    flexShrink: 0,
    whiteSpace: "nowrap",
    boxSizing: "border-box",
    ...(open && {
        ...openedMixin(theme),
        "& .MuiDrawer-paper": openedMixin(theme),
    }),
    ...(!open && {
        ...closedMixin(theme),
        "& .MuiDrawer-paper": closedMixin(theme),
    }),
}));

const openedMixin = (theme) => ({
    width: drawerWidth,
    transition: theme.transitions.create("width", {
        easing: theme.transitions.easing.sharp,
        duration: theme.transitions.duration.enteringScreen,
    }),
    overflowX: "hidden",
});

const closedMixin = (theme) => ({
    transition: theme.transitions.create("width", {
        easing: theme.transitions.easing.sharp,
        duration: theme.transitions.duration.leavingScreen,
    }),
    overflowX: "hidden",
    width: `calc(${theme.spacing(7)} + 1px)`,
    [theme.breakpoints.up("sm")]: {
        width: `calc(${theme.spacing(8)} + 1px)`,
    },
});

export default function DrawerBar({ selected }) {
    const [open, setOpen] = React.useState(false);

    const handleDrawer = () => {
        setOpen(!open);
    };

    const [userLevel, setUserLevel] = React.useState([]);

    const navigate = useNavigate();

    const menuItems = [
        { idx: 0, text: "Profil", icon: <AccountBoxIcon />, link: "/home" },
        {
            idx: 1,
            text: "Tableau de bord",
            icon: <DashboardIcon />,
            link: "/dashboard",
        },
        {
            idx: 2,
            text: "Fiches de cours",
            icon: <ImportContactsIcon />,
            link: "/fiches",
        },
        {
            idx: 3,
            text: "Activité des intervenants",
            icon: <SupervisorAccountIcon />,
            link: "/comptes",
        },
        {
            idx: 4,
            text: "Intervenants",
            icon: <CoPresentRoundedIcon />,
            link: "/intervenants",
        },
    ];

    const handleClickLink = (event) => {
        const text = event.currentTarget.textContent;
        const index = menuItems.findIndex((item) => item.text === text);
        const link = menuItems[index].link;
        navigate(link);
    };

    let lowerButton = ["Déconnexion"];
    const user = JSON.parse(localStorage.getItem("user"));

    if (user !== null) {
        lowerButton =
            user.role.id === 1 ? ["Variables", "Déconnexion"] : ["Déconnexion"];
    }

    return (
        <Drawer
            className="drawer"
            variant="permanent"
            open={open}
            sx={{
                display: "flex",
                justifyContent: "space-between",
                flexDirection: "column",
                alignItems: "center",
            }}
        >
            <Toaster />
            <DrawerHeader>
                <div
                    style={{
                        display: "flex",
                        flexDirection: "column",
                        alignItems: "center",
                        justifyContent: "center",
                    }}
                >
                    <div
                        style={{
                            display: "flex",
                            flexDirection: "row",
                            alignItems: "center",
                            justifyContent: "center",
                        }}
                    >
                        
                        <IconButton onClick={handleDrawer}>
                            {open ? <ChevronLeftIcon /> : <ChevronRightIcon />}
                        </IconButton>
                    </div>
                    
                </div>
            </DrawerHeader>
            
        </Drawer>
    );
}
