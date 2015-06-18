class StationsController < ApplicationController
  include StationsHelper

  def index
  end

  def all
    @payload = Station.all.each.map(&:json)
    render json: { key: "#{ENV['MAPBOX_API']}", colors: key_hashes(@payload), payload: @payload }
  end

end
