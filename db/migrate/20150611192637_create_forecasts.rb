class CreateForecasts < ActiveRecord::Migration
  def change
    create_table :forecasts do |t|
      t.integer :time
      t.integer :temp
      t.integer :dewpoint
      t.integer :wspd
      t.integer :wdir
      t.integer :humidity
      t.integer :feelslike
      t.integer :pressure
      t.integer :station_id

      t.timestamps null: false
    end
  end
end
