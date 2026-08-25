use tauri::{
  plugin::{Builder, TauriPlugin},
  Manager, Runtime,
};

pub use models::*;

#[cfg(desktop)]
mod desktop;
#[cfg(mobile)]
mod mobile;

mod commands;
mod error;
mod models;

pub use error::{Error, Result};

#[cfg(desktop)]
use desktop::Exoplayer;
#[cfg(mobile)]
use mobile::Exoplayer;

/// Extensions to [`tauri::App`], [`tauri::AppHandle`] and [`tauri::Window`] to access the exoplayer APIs.
pub trait ExoplayerExt<R: Runtime> {
  fn exoplayer(&self) -> &Exoplayer<R>;
}

impl<R: Runtime, T: Manager<R>> crate::ExoplayerExt<R> for T {
  fn exoplayer(&self) -> &Exoplayer<R> {
    self.state::<Exoplayer<R>>().inner()
  }
}

/// Initializes the plugin.
pub fn init<R: Runtime>() -> TauriPlugin<R> {
  Builder::new("exoplayer")
    .invoke_handler(tauri::generate_handler![commands::ping])
    .setup(|app, api| {
      #[cfg(mobile)]
      let exoplayer = mobile::init(app, api)?;
      #[cfg(desktop)]
      let exoplayer = desktop::init(app, api)?;
      app.manage(exoplayer);
      Ok(())
    })
    .build()
}
