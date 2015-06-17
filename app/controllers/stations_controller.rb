class StationsController < ApplicationController

  def index
  end

  def all
    @payload = Station.all.each.map(&:json)
    render json: { key: "#{ENV['MAPBOX_API']}", payload: @payload }
  end

end
