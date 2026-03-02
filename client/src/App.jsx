import { useEffect, useState } from 'react';
import ReactMarkdown from 'react-markdown';
import './App.css';

function TarjetaNoticia({ post }) {
  const [expandido, setExpandido] = useState(false);
  const [contenidoCompleto, setContenidoCompleto] = useState("");
  const [cargando, setCargando] = useState(false);

  const manejarClick = () => {
    if (expandido) {
      setExpandido(false);
      return;
    }

    if (!contenidoCompleto) {
      setCargando(true);
      fetch(`/api/posts/${post.id}`)
        .then(res => res.json())
        .then(data => {
          setContenidoCompleto(data.contenido);
          setCargando(false);
          setExpandido(true);
        })
        .catch(err => {
          console.error("Error", err);
          setCargando(false);
        });
    } else {
      setExpandido(true);
    }
  };

  return (
    <article className="tarjeta-noticia">
      {post.imagen && (
        <img src={`/img/${post.imagen}`} alt={post.titulo} className="imagen-noticia" />
      )}
      <div className="contenido-noticia">
        <span className="fecha-noticia">{post.fecha}</span>
        <h2>{post.titulo}</h2>
        
        <div className="texto-noticia">
          {expandido ? (
            <div className="texto-markdown">
              {cargando ? <p>Cargando...</p> : <ReactMarkdown>{contenidoCompleto}</ReactMarkdown>}
            </div>
          ) : (
            <p>{post.resumen}</p>
          )}
        </div>
        <button className="btn-leer-mas" onClick={manejarClick}>
          {expandido ? 'Ocultar' : 'Ver mas'}
        </button>
      </div>
    </article>
  );
}

function PanelAdmin({ volver, posts, refrescarNoticias }) {
  const [clave, setClave] = useState('');
  const [autorizado, setAutorizado] = useState(false);
  const [vistaAdmin, setVistaAdmin] = useState('lista');
  const [mensaje, setMensaje] = useState('');

  const [idEditando, setIdEditando] = useState(null);
  const [titulo, setTitulo] = useState('');
  const [contenido, setContenido] = useState('');
  const [imagen, setImagen] = useState(null);
  const [imagenActual, setImagenActual] = useState(null);

  if(!autorizado){
    return (
      <div className="panel-admin-login">
        <h2>Area Restringida 🔒</h2>
        <input type="password" placeholder="Contraseña" value={clave} onChange={(e) => setClave(e.target.value)} className="input-admin" />
        <button className="btn-leer-mas" onClick={() => clave === 'secreto' ? setAutorizado(true) : alert('Clave incorrecta')}>Entrar</button>
        <button className="btn-cancelar" onClick={volver}>Cancelar</button>
      </div>
    );
  }

  const manejarEliminar = async (id) => {
    if (window.confirm('¿Estas seguro de que quieres eliminar esta noticia?')) {
      await fetch(`/api/posts/${id}`, { method: 'DELETE' });
      refrescarNoticias();
    }
  };

  const prepararEdicion = async (id) => {
    setMensaje('Cargando datos...');
    const res = await fetch(`/api/posts/${id}`);
    const data = await res.json();
    
    setIdEditando(data.id);
    setTitulo(data.titulo);
    setContenido(data.contenido);
    setImagenActual(data.imagen);
    setImagen(null);
    setMensaje('');
    setVistaAdmin('formulario');
  };

  const prepararCreacion = () => {
    setIdEditando(null); setTitulo(''); setContenido(''); setImagen(null); setImagenActual(null);
    setVistaAdmin('formulario');
  };

  const manejarEnvio = async (e) => {
  e.preventDefault();
  setMensaje(idEditando ? 'Actualizando...' : 'Publicando...');

  const formData = new FormData();
  formData.append('titulo', titulo);
  formData.append('contenido', contenido);
  if (imagen) formData.append('imagen', imagen);
  if (imagenActual) formData.append('imagenActual', imagenActual);

  const url = idEditando ? `/api/posts/${idEditando}` : '/api/posts';
  const metodo = idEditando ? 'PUT' : 'POST';

  try {
    const response = await fetch(url, { method: metodo, body: formData });
    const data = await response.json();

    if (response.ok) {
      setMensaje('¡Listo!');
      refrescarNoticias();
      setTimeout(() => { setVistaAdmin('lista'); setMensaje(''); }, 1500);
    } else {
      setMensaje(`Error: ${data.error || 'Algo salio mal.'}`);
    }
  } catch (error) {
    setMensaje('Error de conexion con el servidor.');
    console.error(error);
  }
};

  if (vistaAdmin === 'lista') {
    return (
      <div className="formulario-admin">
        <h2>Panel de Control ⚙️</h2>
        <button className="btn-leer-mas" onClick={prepararCreacion} style={{marginBottom: '1.5rem', backgroundColor: '#2e7d32'}}>+ Crear Nueva Noticia</button>
        
        <ul style={{listStyle: 'none', padding: 0}}>
          {posts.map(post => (
            <li key={post.id} style={{borderBottom: '1px solid #ddd', padding: '1rem 0', display: 'flex', justifyContent: 'space-between', alignItems: 'center'}}>
              <span style={{fontWeight: 'bold', color: '#333'}}>{post.titulo}</span>
              <div style={{display: 'flex', gap: '10px'}}>
                <button className="btn-accion btn-editar" onClick={() => prepararEdicion(post.id)}>✏️</button>
                <button className="btn-accion btn-eliminar" onClick={() => manejarEliminar(post.id)}>🗑️</button>
              </div>
            </li>
          ))}
        </ul>
        <button className="btn-cancelar" onClick={volver} style={{marginTop: '2rem'}}>Salir del Panel</button>
      </div>
    );
  }
  return (
    <form className="formulario-admin" onSubmit={manejarEnvio}>
      <h2>{idEditando ? 'Editar Noticia ✏️' : 'Publicar Noticia ✍️'}</h2>
      
      <label>Titulo de la noticia:</label>
      <input type="text" required className="input-admin" value={titulo} onChange={(e) => setTitulo(e.target.value)} />

      <label>Contenido:</label>
      <textarea required className="textarea-admin" rows="8" value={contenido} onChange={(e) => setContenido(e.target.value)} />

      <label>Imagen de portada {idEditando && '(Deja vacio para no cambiarla)'}:</label>
      <input type="file" accept="image/*" className="file-admin" required={!idEditando} onChange={(e) => setImagen(e.target.files[0])} />

      <button type="submit" className="btn-leer-mas" style={{marginTop: '1rem'}}>{idEditando ? 'Guardar Cambios' : 'Publicar Ahora'}</button>
      <button type="button" className="btn-cancelar" onClick={() => setVistaAdmin('lista')}>Cancelar</button>
      
      {mensaje && <p className="mensaje-feedback">{mensaje}</p>}
    </form>
  );
}

function Footer() {
  const anioActual = new Date().getFullYear();
  return (
    <footer className="footer">
      <div className="footer-contenido">
        <div className="footer-seccion">
          <h3>Acerca de nosotros</h3>
          <p>
            Somos una fuente confiable de noticias.
            Nuestro objetivo es mantenerte informado acerca de lo mas reciente que ocurre en mundo.
          </p>
        </div>
        <div className="footer-seccion">
          <h3>Siguenos</h3>
          <div className="redes-sociales">
            <a href="https://facebook.com" target="_blank" rel="noopener noreferrer" aria-label="Facebook">
              <svg viewBox="0 0 24 24" width="28" height="28" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round">
                <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"></path>
              </svg>
            </a>

            <a href="https://instagram.com" target="_blank" rel="noopener noreferrer" aria-label="Instagram">
              <svg viewBox="0 0 24 24" width="28" height="28" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round">
                <rect x="2" y="2" width="20" height="20" rx="5" ry="5"></rect>
                <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"></path>
                <line x1="17.5" y1="6.5" x2="17.51" y2="6.5"></line>
              </svg>
            </a>

            <a href="https://tiktok.com" target="_blank" rel="noopener noreferrer" aria-label="TikTok">
              <svg viewBox="0 0 24 24" width="28" height="28" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round">
                <path d="M9 0h1.98c.144 2.096 1.522 3.708 3.536 3.959v2.159c-1.14-.064-2.164-.543-2.903-1.282V10.15c0 3.32-2.677 6.012-5.98 6.012C2.33 16.162 0 13.47 0 10.15s2.33-6.012 5.633-6.012v2.21A3.804 3.804 0 0 0 1.83 10.15c0 2.1 1.703 3.803 3.804 3.803 2.1 0 3.803-1.704 3.803-3.803V0h-.437z" stroke="none" fill="currentColor"></path>
              </svg>
            </a>
          </div>
        </div>
      </div>

      <div className="footer-bottom">
        <p>&copy; {anioActual} Noticias Web. Todos los derechos reservados.</p>
      </div>
    </footer> 
  )
}

function App() {
  const [posts, setPosts] = useState([]);
  const [vista, setVista] = useState('inicio');

  const cargarNoticias = () => {
    fetch('/api/posts')
      .then(response => response.json())
      .then(data => setPosts(data.posts))
      .catch(error => console.error('Error:', error));
  };

  useEffect(() => {
    cargarNoticias();
  }, []);
  
  return (
    <div className="App">
      <header className="header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{width: '24px'}}></div>
        <h1>Noticias</h1>
        <button 
          onClick={() => setVista(vista === 'inicio' ? 'admin' : 'inicio')} 
          style={{background: 'none', border: 'none', fontSize: '1.2rem', cursor: 'pointer', padding: '0.5rem'}}
        >
          ⚙️
        </button>
      </header>
      
      <main className="contenedor-noticias">
        {vista === 'inicio' ? (
          posts.length > 0 ? (
            posts.map((post) => <TarjetaNoticia key={post.id} post={post} />)
          ) : <p>Cargando noticias...</p>
        ) : (
          <PanelAdmin volver={() => setVista('inicio')} posts={posts} refrescarNoticias={cargarNoticias} />
        )}
      </main>

      <Footer />
    </div>
  );
}

export default App;