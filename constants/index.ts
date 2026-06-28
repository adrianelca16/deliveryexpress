import arrowBack from "../assets/icons/arrow-back.png";
import arrowDown from "@/assets/icons/arrow-down.png";
import arrowRight from "@/assets/icons/arrow-right.png";
import bag from "@/assets/icons/bag.png";
import check from "@/assets/icons/check.png";
import clock from "@/assets/icons/clock.png";
import dollar from "@/assets/icons/dollar.png";
import envelope from "@/assets/icons/envelope.png";
import home from "@/assets/icons/home.png";
import location from "@/assets/icons/location.png";
import logout from "@/assets/icons/logout.png";
import minus from "@/assets/icons/minus.png";
import pencil from "@/assets/icons/pencil.png";
import person from "@/assets/icons/person.png";
import phone from "@/assets/icons/phone.png";
import plus from "@/assets/icons/plus.png";
import search from "@/assets/icons/search.png";
import star from "@/assets/icons/star.png";
import trash from "@/assets/icons/trash.png";
import user from "@/assets/icons/user.png";

import avatar from "@/assets/images/avatar.png";
import loginGraphic from "@/assets/images/login.png";
import pruebaGrafica from '@/assets/images/icon.png'
import platos from '@/assets/icons/tenedor.png'
import arrowSimple from '@/assets/icons/arrow-simple.png'
import carga from '@/assets/images/CARGA.png'
import pizzaInicio from '@/assets/images/PIZZA_INICIO.png'
import pizza_detective from '@/assets/images/PIZZA_DETECTIVE.png'
import hamburguesa_detective from '@/assets/images/HAMBURGUESA_SELFIE.png'
import placeholder from '@/assets/images/RESTAURANTE_EJEMPLO 02.png'
import papa_mapa from '@/assets/images/PAPA_MAPA.png'
import banner_1 from '@/assets/images/Banner.png'
import banner_2 from '@/assets/images/Banner_2.png'
import banner_3 from '@/assets/images/Banner_3.png'
import Venezuela from '@/assets/venezuela.json'

import catPizza from '@/assets/categories/pizza.png'
import catBurger from '@/assets/categories/burger.png'
import catSushi from '@/assets/categories/sushi.png'
import catTaco from '@/assets/categories/taco.png'
import catPasta from '@/assets/categories/pasta.png'
import catDessert from '@/assets/categories/dessert.png'
import catDrink from '@/assets/categories/drink.png'
import catChicken from '@/assets/categories/chicken.png'
import catCoffee from '@/assets/categories/coffee.png'
import catSalad from '@/assets/categories/salad.png'
import catSeafood from '@/assets/categories/seafood.png'

export const CATEGORIES = [
    {
        id: "1",
        name: "All",
    },
    {
        id: "2",
        name: "Burger",
    },
    {
        id: "3",
        name: "Pizza",
    },
    {
        id: "4",
        name: "Wrap",
    },
    {
        id: "5",
        name: "Burrito",
    },
];

export const images = {
    avatar,
    loginGraphic,
    arrowBack,
    arrowDown,
    arrowRight,
    bag,
    check,
    clock,
    dollar,
    envelope,
    home,
    location,
    logout,
    minus,
    pencil,
    person,
    phone,
    plus,
    search,
    star,
    trash,
    user,
    pruebaGrafica,
    platos,
    arrowSimple,
    carga,
    pizzaInicio,
    pizza_detective,
    hamburguesa_detective,
    placeholder,
    papa_mapa,
    banner_1,
    banner_2,
    banner_3,
    catPizza,
    catBurger,
    catSushi,
    catTaco,
    catPasta,
    catDessert,
    catDrink,
    catChicken,
    catCoffee,
    catSalad,
    catSeafood,
};

export const categoryImages: Record<string, any> = {
  pizza: catPizza,
  burger: catBurger,
  hamburguesa: catBurger,
  sushi: catSushi,
  taco: catTaco,
  tacos: catTaco,
  pasta: catPasta,
  dessert: catDessert,
  postre: catDessert,
  postres: catDessert,
  drink: catDrink,
  bebida: catDrink,
  bebidas: catDrink,
  chicken: catChicken,
  pollo: catChicken,
  coffee: catCoffee,
  café: catCoffee,
  salad: catSalad,
  ensalada: catSalad,
  seafood: catSeafood,
  mariscos: catSeafood,
};

export const getCategoryImage = (nombre?: string) => {
  if (!nombre) return undefined;
  const key = nombre.toLowerCase().trim();
  return categoryImages[key] || undefined;
};

const categoryColorMap: Record<string, string> = {
  italiana: '#FFF0F0',
  mexicana: '#FFF4E6',
  china: '#FFF8E1',
  'fast food': '#F3E5F5',
  vegana: '#E8F5E9',
  postres: '#FCE4EC',
  pizza: '#FFF0F0',
  burger: '#F3E5F5',
  hamburguesa: '#F3E5F5',
  sushi: '#E0F7FA',
  taco: '#FFF4E6',
  tacos: '#FFF4E6',
  pasta: '#FFF8E1',
  dessert: '#FCE4EC',
  postre: '#FCE4EC',
  chicken: '#FFF3E0',
  pollo: '#FFF3E0',
  coffee: '#EFEBE9',
  café: '#EFEBE9',
  salad: '#E8F5E9',
  ensalada: '#E8F5E9',
  seafood: '#E0F2F1',
  mariscos: '#E0F2F1',
  bebida: '#E3F2FD',
  bebidas: '#E3F2FD',
};

export const getCategoryColor = (nombre?: string) => {
  if (!nombre) return '#F3F4F6';
  return categoryColorMap[nombre.toLowerCase().trim()] || '#F3F4F6';
};

export const VenezuelaEstados = Venezuela

export const API_URL = 'http://161.97.137.192:8004';
export { THEME_PRIMARY, THEME_SECONDARY, THEME_NAME } from './theme';