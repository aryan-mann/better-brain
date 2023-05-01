import '../app.css';
import Popup from './Popup.svelte';

const target = document.getElementById('mount');

async function render() {
  new Popup({ target });
}

document.addEventListener('DOMContentLoaded', render);
